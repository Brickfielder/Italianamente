import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import matter from "gray-matter";

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

const getPullRequest = async (pullRequestNumber: number) => {
  const octokit = getOctokit();
  const { owner, repo } = repository();
  return octokit.pulls.get({
    owner,
    repo,
    pull_number: pullRequestNumber,
  });
};

export const getPullRequestHeadSha = async (pullRequestNumber: number) =>
  (await getPullRequest(pullRequestNumber)).data.head.sha;

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

export const removeHomeReferences = (
  source: string,
  documentPath: string
) => {
  const parsed = matter(source);
  const tiles = Array.isArray(parsed.data.tiles) ? parsed.data.tiles : [];
  const filteredTiles = tiles.filter(
    (tile) =>
      !tile ||
      typeof tile !== "object" ||
      (tile as { postReference?: string }).postReference !== documentPath
  );

  if (filteredTiles.length === tiles.length) {
    return source;
  }

  return matter.stringify(parsed.content, {
    ...parsed.data,
    tilesLastUpdated: new Date().toISOString(),
    tiles: filteredTiles,
  });
};

const decodeRepositoryContent = (content: string) =>
  Buffer.from(content.replace(/\n/g, ""), "base64").toString("utf8");

const deploymentBranch = (deployment: VercelDeployment) =>
  deployment.meta?.githubCommitRef ||
  deployment.meta?.gitBranch ||
  deployment.meta?.gitlabCommitRef ||
  deployment.meta?.bitbucketCommitRef ||
  null;

const deploymentCommitSha = (deployment: VercelDeployment) =>
  deployment.meta?.githubCommitSha ||
  deployment.meta?.gitCommitSha ||
  deployment.meta?.commitSha ||
  deployment.meta?.gitlabCommitSha ||
  deployment.meta?.bitbucketCommitSha ||
  null;

export const selectPreviewDeployment = (
  deployments: VercelDeployment[],
  branch: string,
  expectedCommitSha?: string
): PreviewLookupResult => {
  const deployment = deployments
    .filter((item) => {
      if (deploymentBranch(item) !== branch) {
        return false;
      }

      if (!expectedCommitSha) {
        return true;
      }

      return deploymentCommitSha(item) === expectedCommitSha;
    })
    .sort((left, right) => (right.createdAt ?? 0) - (left.createdAt ?? 0))[0];

  if (!deployment?.url) {
    return { ready: false, url: null };
  }

  return deployment.readyState === "READY"
    ? { ready: true, url: `https://${deployment.url}` }
    : { ready: false, url: null };
};

export const getPreviewUrl = async (
  branch: string,
  expectedCommitSha?: string
) => {
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
  return selectPreviewDeployment(
    data.deployments ?? [],
    branch,
    expectedCommitSha
  );
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
  const baseCommit = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: baseSha,
  });
  const blob = await octokit.git.createBlob({
    owner,
    repo,
    content: serializeStudioDocument(document),
    encoding: "utf-8",
  });
  const tree = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseCommit.data.tree.sha,
    tree: [
      {
        path: document.documentPath,
        mode: "100644",
        type: "blob",
        sha: blob.data.sha,
      },
    ],
  });
  const commit = await octokit.git.createCommit({
    owner,
    repo,
    message: `content(studio): update ${document.title}`,
    tree: tree.data.sha,
    parents: [baseSha],
  });
  try {
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: commit.data.sha,
    });
  } catch (error) {
    if ((error as { status?: number }).status !== 422) {
      throw error;
    }
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: commit.data.sha,
      force: true,
    });
  }

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
  const previewCommitSha = commit.data.sha;

  return {
    branch,
    baseSha,
    pullRequestNumber: pullRequest.number,
    pullRequestUrl: pullRequest.html_url,
    previewUrl: (await getPreviewUrl(branch, previewCommitSha)).url,
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

export async function deleteStudioDocument(document: StudioDocument) {
  if (document.documentType !== "post") {
    throw new Error("Only articles can be deleted from Studio.");
  }

  const octokit = getOctokit();
  const { owner, repo } = repository();
  const main = await octokit.git.getRef({
    owner,
    repo,
    ref: "heads/main",
  });
  const baseSha = main.data.object.sha;
  const baseCommit = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: baseSha,
  });
  const treeEntries: Array<{
    path: string;
    mode: "100644";
    type: "blob";
    sha: string | null;
  }> = [
    {
      path: document.documentPath,
      mode: "100644",
      type: "blob",
      sha: null,
    },
  ];

  const homeResponse = await octokit.repos.getContent({
    owner,
    repo,
    path: "content/page/home.mdx",
    ref: baseSha,
  });
  if (!Array.isArray(homeResponse.data) && "content" in homeResponse.data) {
    const homeSource = decodeRepositoryContent(homeResponse.data.content);
    const updatedHome = removeHomeReferences(
      homeSource,
      document.documentPath
    );
    if (updatedHome !== homeSource) {
      const homeBlob = await octokit.git.createBlob({
        owner,
        repo,
        content: updatedHome,
        encoding: "utf-8",
      });
      treeEntries.push({
        path: "content/page/home.mdx",
        mode: "100644",
        type: "blob",
        sha: homeBlob.data.sha,
      });
    }
  }

  const tree = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseCommit.data.tree.sha,
    tree: treeEntries,
  });
  const commit = await octokit.git.createCommit({
    owner,
    repo,
    message: `content(studio): delete ${document.title}`,
    tree: tree.data.sha,
    parents: [baseSha],
  });
  await octokit.git.updateRef({
    owner,
    repo,
    ref: "heads/main",
    sha: commit.data.sha,
  });

  if (document.pullRequestNumber) {
    await octokit.pulls
      .update({
        owner,
        repo,
        pull_number: document.pullRequestNumber,
        state: "closed",
      })
      .catch(() => undefined);
  }
  if (document.previewBranch) {
    await octokit.git
      .deleteRef({
        owner,
        repo,
        ref: `heads/${document.previewBranch}`,
      })
      .catch(() => undefined);
  }

  return { sha: commit.data.sha };
}
