import { describe, it, expect, vi } from "vitest";
import { runMediaStep, type MediaDeps } from "@/lib/media-step";

const draft = { cover_prompt: "editorial shot of …", intro_prompt: "slow zoom into …" };

function makeDeps(over: Partial<MediaDeps> = {}): MediaDeps {
  return {
    genCover: vi.fn().mockResolvedValue({ url: "https://runware/img.jpg", cost: 0.02, task_uuid: "c1" }),
    genIntro: vi.fn().mockResolvedValue({ url: "https://runware/vid.mp4", cost: 0.1, task_uuid: "v1" }),
    mirror: vi.fn().mockImplementation(async (_url: string, key: string) => `https://com27/cad/${key}`),
    ...over,
  };
}

describe("runMediaStep", () => {
  it("returns mirrored com27 URLs + sums cost", async () => {
    const deps = makeDeps();
    const r = await runMediaStep(draft, { date: "2026-06-17" }, deps);
    expect(r.cover_url).toBe("https://com27/cad/2026-06-17/cover.jpg");
    expect(r.intro_url).toBe("https://com27/cad/2026-06-17/intro.mp4");
    expect(r.cost_usd).toBeCloseTo(0.12);
    expect(r.errors).toHaveLength(0);
    expect(deps.mirror).toHaveBeenCalledTimes(2);
  });

  it("survives intro failure without aborting cover", async () => {
    const deps = makeDeps({ genIntro: vi.fn().mockRejectedValue(new Error("Seedance 500")) });
    const r = await runMediaStep(draft, { date: "2026-06-17" }, deps);
    expect(r.cover_url).toContain("cover.jpg");
    expect(r.intro_url).toBeNull();
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toContain("intro");
  });

  it("survives cover failure too", async () => {
    const deps = makeDeps({ genCover: vi.fn().mockRejectedValue(new Error("FLUX 429")) });
    const r = await runMediaStep(draft, { date: "2026-06-17" }, deps);
    expect(r.cover_url).toBeNull();
    expect(r.intro_url).toContain("intro.mp4");
    expect(r.errors).toContainEqual(expect.stringContaining("cover"));
  });
});
