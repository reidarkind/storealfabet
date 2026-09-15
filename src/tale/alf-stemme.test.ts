import { describe, expect, it, vi } from "vitest";
import { medKjorendeLyd } from "./alf-stemme";

describe("medKjorendeLyd", () => {
  it("gir opp uten lydkontekst", async () => {
    expect(await medKjorendeLyd(() => "x", null)).toBeNull();
  });

  it("venter på resume før toner planlegges", async () => {
    const rekkefolge: string[] = [];
    const ctx = {
      state: "suspended" as AudioContextState,
      resume: vi.fn(async () => {
        rekkefolge.push("resume");
        ctx.state = "running";
      }),
    } as unknown as AudioContext;

    const resultat = await medKjorendeLyd((c) => {
      rekkefolge.push("spill");
      expect(c.state).toBe("running");
      return "ok";
    }, ctx);

    expect(resultat).toBe("ok");
    expect(rekkefolge).toEqual(["resume", "spill"]);
  });

  it("hopper over spill hvis resume feiler", async () => {
    let spilt = false;
    const ctx = {
      state: "suspended" as AudioContextState,
      resume: vi.fn(async () => {
        throw new Error("nei");
      }),
    } as unknown as AudioContext;

    expect(
      await medKjorendeLyd(() => {
        spilt = true;
        return "x";
      }, ctx),
    ).toBeNull();
    expect(spilt).toBe(false);
  });
});
