import { describe, expect, it } from "vitest";
import { SvarVakt } from "./svar-vakt";

describe("svar-vakt", () => {
  it("tar bare det første trykket til neste spørsmål er klart", () => {
    const vakt = new SvarVakt();
    expect(vakt.godta()).toBe(true);
    expect(vakt.godta()).toBe(false);
    expect(vakt.godta()).toBe(false);
    vakt.slipp();
    expect(vakt.godta()).toBe(true);
    expect(vakt.godta()).toBe(false);
  });
});
