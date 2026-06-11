import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

import { serializeStudioDocument } from "./serialize";
import type { StudioDocument } from "./types";

type DeploymentMeta = Record<string, string | undefined>;

type VercelDeployment = {
  createdAt?: number;
  meta?: DeploymentMeta;
  readyState?: string;
  url?: string;
};

type PreviewLookupResult = {
  ready: boolean;
  url: string | null;
};

const repository = () => {
  const [owner, repo] = (
    process.env.GITHUB_REPOSITORY || "Brickfielder/Italianamente"
  ).split("/");

  if (!owner || !repo) {
    throw new Error("GITHUB_REPOSITORY must use owner/repository format.");
  }

  return { owner, repo };
};

export const getPullRequestUrl = (pullRequestNumber: number) => {
  const { owner, repo } = repository();
  return `https://github.com/${owner}/${repo}/pull/${pullRequestNumber}`;
};

const getOctokit = () => {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;

  if (!appId || !privateKey || !installationId) {
    throw new Error("GitHub App credentials are not configured.");
  }

  return new Octokit({
    authStrategy: createAppAuth,
    auth: { appId, privateKey, installationId },
  });
};

const branchNameFor = (documentPath: string) =>
  `studio/${documentPath
    .replace(/^content\//, "")
    .replace(/\.mdx$/, "")
    .replace(/[^a-zA-Z0-9/_-]/g, "-")
    .replace(/\//g, "-")
    .toLowerCase()}`;

const deploymentBranch = (deployment: VercelDeployment) =>
  deployment.meta?.githubCommitRef ||
  deployment.meta?.gitBranch ||
  deployment.meta?.gitlabCommitRef ||
  deployment.meta?.bitbucketCommitRef ||
  null;

export const selectPreviewDeployment = (
  deployments: VercelDeployment[],
  branch: string
): PreviewLookupResult => {
  const deployment = deployments
    .filter((item) => deploymentBranch(item) === branch)
    .sort((left, right) => (right.createdAt ?? 0) - (left.createdAt ?? 0))[0];

  if (!deployment?.url) {
    return { ready: false, url: null };
  }

  return deployment.readyState === "READY"
    ? { ready: true, url: `https://${deployment.url}` }
    : { ready: false, url: null };
};

export const getPreviewUrl = async (branch: string) => {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) {
    return { ready: false, url: null };
  }

  const params = new URLSearchParams({
    projectId,
    limit: "20",
    target: "preview",
  });
  if (process.env.VERCEL_TEAM_ID) {
    params.set("teamId", process.env.VERCEL_TEAM_ID);
  }

  const response = await fetch(
    `https://api.vercel.com/v6/deployments?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  if (!response.ok) {
    return { ready: false, url: null };
  }

  const data = (await response.json()) as {
    deployments?: VercelDeployment[];
  };
  return selectPreviewDeployment(data.deployments ?? [], branch);
};

export const hasPreviewLookup = () =>
  Boolean(process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID);

export async function createPreview(document: StudioDocument) {
  const octokit = getOctokit();
  const { owner, repo } = repository();
  const branch = document.previewBranch || branchNameFor(document.documentPath);
  const base = await octokit.git.getRef({
    owner,
    repo,
    ref: "heads/main",
  });
  const baseSha = base.data.object.sha;

  try {
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: baseSha,
    });
  } catch (error) {
    if ((error as { status?: number }).status !== 422) {
      throw error;
    }
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: baseSha,
      force: true,
    });
  }

  let currentSha: string | undefined;
  try {
    const current = await octokit.repos.getContent({
      owner,
      repo,
      path: document.documentPath,
      ref: branch,
    });
    if (!Array.isArray(current.data) && current.data.type === "file") {
      currentSha = current.data.sha;
    }
  } catch (error) {
    if ((error as { status?: number }).status !== 404) {
      throw error;
    }
  }

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: document.documentPath,
    branch,
    message: `content(studio): update ${document.title}`,
    content: Buffer.from(serializeStudioDocument(document)).toString("base64"),
    ...(currentSha ? { sha: currentSha } : {}),
  });

  const existing = await octokit.pulls.list({
    owner,
    repo,
    state: "open",
    head: `${owner}:${branch}`,
    base: "main",
  });
  const pullRequest =
    existing.data[0] ??
    (
      await octokit.pulls.create({
        owner,
        repo,
        head: branch,
        base: "main",
        title: `Studio: ${document.title}`,
        body: "Created by Italianamente Studio. Review the Vercel preview before publishing.",
      })
    ).data;

  return {
    branch,
    baseSha,
    pullRequestNumber: pullRequest.number,
    pullRequestUrl: pullRequest.html_url,
    previewUrl: (await getPreviewUrl(branch)).url,
  };
}

export async function publishPreview(input: {
  pullRequestNumber: number;
  baseSha?: string | null;
}) {
  const octokit = getOctokit();
  const { owner, repo } = repository();
  const currentMain = await octokit.git.getRef({
    owner,
    repo,
    ref: "heads/main",
  });

  if (input.baseSha && currentMain.data.object.sha !== input.baseSha) {
    throw new Error(
      "Main changed after this preview was created. Create a fresh preview before publishing."
    );
  }

  const result = await octokit.pulls.merge({
    owner,
    repo,
    pull_number: input.pullRequestNumber,
    merge_method: "squash",
    commit_title: `Publish Studio update (#${input.pullRequestNumber})`,
  });

  if (!result.data.merged) {
    throw new Error(result.data.message || "GitHub could not merge the preview.");
  }

  return { sha: result.data.sha };
}
