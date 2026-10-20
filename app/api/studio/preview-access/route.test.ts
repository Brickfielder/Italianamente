import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/studio/session", () => ({ requireStudioUser: vi.fn() }));
vi.mock("../../../../lib/studio/repository", () => ({ getDraft: vi.fn() }));
vi.mock("../../../../lib/studio/github", () => ({
  createPreviewShareUrl: vi.fn(), getPreviewUrl: vi.fn(), getPullRequestHeadSha: vi.fn(),
}));

import { requireStudioUser } from "../../../../lib/studio/session";
import { getDraft } from "../../../../lib/studio/repository";
import { createPreviewShareUrl, getPreviewUrl, getPullRequestHeadSha } from "../../../../lib/studio/github";
import { GET } from "./route";

const id = "5d14ad32-7e9c-4be2-9f9b-5f6e8ad1b9ce";
const request = () => new Request(`https://www.italianamente.co.uk/api/studio/preview-access?id=${id}`);

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(requireStudioUser).mockResolvedValue({ id: "editor", email: "editor@example.com" });
  vi.mocked(getDraft).mockResolvedValue({
    documentPath: "content/culture/esempio.mdx", documentType: "post",
    previewBranch: "studio/post", pullRequestNumber: 42,
    payload: { previewUrl: "https://attacker.example" },
  } as Awaited<ReturnType<typeof getDraft>>);
  vi.mocked(getPullRequestHeadSha).mockResolvedValue("current");
  vi.mocked(getPreviewUrl).mockResolvedValue({ ready: true, url: "https://preview.vercel.app", deploymentId: "dpl_test" });
  vi.mocked(createPreviewShareUrl).mockResolvedValue("https://preview.vercel.app/culture/esempio?_vercel_share=test");
});

describe("Studio preview access", () => {
  it("requires a Studio session before looking up a draft or granting access", async () => {
    vi.mocked(requireStudioUser).mockRejectedValue(new Error("Not authenticated"));
    const response = await GET(request());
    expect(response.headers.get("location")).toBe("https://www.italianamente.co.uk/studio");
    expect(getDraft).not.toHaveBeenCalled();
    expect(createPreviewShareUrl).not.toHaveBeenCalled();
  });

  it("rejects invalid draft IDs", async () => {
    const response = await GET(new Request("https://www.italianamente.co.uk/api/studio/preview-access?id=bad"));
    expect(response.status).toBe(400);
    expect(getDraft).not.toHaveBeenCalled();
  });

  it("redirects to a temporary link for the current commit, ignoring a saved URL", async () => {
    const response = await GET(request());
    expect(getPullRequestHeadSha).toHaveBeenCalledWith(42);
    expect(getPreviewUrl).toHaveBeenCalledWith("studio/post", "current");
    expect(createPreviewShareUrl).toHaveBeenCalledWith("dpl_test", expect.objectContaining({
      documentPath: "content/culture/esempio.mdx", previewUrl: "https://preview.vercel.app",
    }));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("?_vercel_share=test");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });

  it("does not share a missing or not-ready preview", async () => {
    vi.mocked(getDraft).mockResolvedValueOnce({} as Awaited<ReturnType<typeof getDraft>>);
    expect((await GET(request())).status).toBe(409);
    vi.mocked(getPreviewUrl).mockResolvedValue({ ready: false, url: null });
    expect((await GET(request())).status).toBe(409);
    expect(createPreviewShareUrl).not.toHaveBeenCalled();
  });

  it("does not disclose provider errors", async () => {
    vi.mocked(createPreviewShareUrl).mockRejectedValue(new Error("API secret details"));
    const response = await GET(request());
    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain("API secret details");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
