import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createPreviewShareUrl, selectPreviewDeployment } from "./github";
import type { StudioDocument } from "./types";

const post: StudioDocument = {
  documentPath: "content/culture/esempio.mdx",
  documentType: "post",
  title: "Esempio",
  body: "",
  previewUrl: "https://preview.vercel.app",
};

beforeEach(() => {
  vi.stubEnv("VERCEL_TOKEN", "test-api-token");
  vi.stubEnv("VERCEL_TEAM_ID", "team_test");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("temporary preview links", () => {
  it.each([
    [post, "/culture/esempio"],
    [{ ...post, documentType: "home" as const }, "/"],
    [{ ...post, documentType: "page" as const, documentPath: "content/page/about.mdx" }, "/about"],
  ])("opens the correct document route", async (document, pathname) => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      protectionBypass: {
        permanent: { scope: "shareable-link" },
        expired: { scope: "shareable-link", expires: Date.now() / 1000 - 10 },
        temporary: { scope: "shareable-link", expires: Date.now() / 1000 + 3500 },
      },
    })));
    vi.stubGlobal("fetch", fetch);
    const url = new URL(await createPreviewShareUrl("dpl_test", document));
    expect(url.origin).toBe("https://preview.vercel.app");
    expect(url.pathname).toBe(pathname);
    expect(url.searchParams.get("_vercel_share")).toBe("temporary");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.vercel.com/aliases/dpl_test/protection-bypass?teamId=team_test",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ ttl: 3600 }),
        cache: "no-store",
        headers: expect.objectContaining({ Authorization: "Bearer test-api-token" }),
      })
    );
  });

  it("rejects redirects away from the selected deployment before creating access", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(createPreviewShareUrl("dpl_test", {
      ...post, documentPath: "/attacker.example/steal.mdx",
    })).rejects.toThrow("Invalid preview URL");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fails closed when the API refuses sharing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Sensitive provider details", { status: 403 })));
    await expect(createPreviewShareUrl("dpl_test", post)).rejects.toThrow("Unable to create a temporary preview link.");
  });

  it("rejects permanent and overlong links", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      protectionBypass: {
        permanent: { scope: "shareable-link" },
        long: { scope: "shareable-link", expires: Date.now() / 1000 + 86400 },
      },
    }))));
    await expect(createPreviewShareUrl("dpl_test", post)).rejects.toThrow("No temporary preview link");
  });

  it("retains the deployment ID only for a ready matching commit", () => {
    const deployments = [{ uid: "dpl_test", readyState: "READY", url: "preview.vercel.app", meta: {
      githubCommitRef: "studio/post", githubCommitSha: "current",
    } }];
    expect(selectPreviewDeployment(deployments, "studio/post", "current")).toEqual({
      ready: true, url: "https://preview.vercel.app", deploymentId: "dpl_test",
    });
    expect(selectPreviewDeployment(deployments, "studio/post", "stale")).toEqual({ ready: false, url: null });
  });
});
