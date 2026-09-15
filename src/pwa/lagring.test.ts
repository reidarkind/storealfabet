import { describe, expect, it } from "vitest";
import { beVarigLagring } from "./lagring";

describe("varig lagring", () => {
  it("gir opp når telefonen ikke støtter persist", async () => {
    expect(await beVarigLagring(null)).toBe(false);
  });

  it("hopper over hvis lagringen allerede er varig", async () => {
    let persistKalt = false;
    const ok = await beVarigLagring({
      persisted: async () => true,
      persist: async () => {
        persistKalt = true;
        return true;
      },
    });
    expect(ok).toBe(true);
    expect(persistKalt).toBe(false);
  });

  it("ber om varig lagring når den ikke er satt", async () => {
    const ok = await beVarigLagring({
      persisted: async () => false,
      persist: async () => true,
    });
    expect(ok).toBe(true);
  });

  it("tåler at nettleseren avslår eller kaster", async () => {
    expect(
      await beVarigLagring({
        persisted: async () => false,
        persist: async () => false,
      }),
    ).toBe(false);
    expect(
      await beVarigLagring({
        persist: async () => {
          throw new Error("nei");
        },
      }),
    ).toBe(false);
  });
});
