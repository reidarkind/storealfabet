import { describe, expect, it } from "vitest";
import { lerretPunkt } from "./punkt";

describe("lerretPunkt", () => {
  it("mapper fingeren til lerretets piksler når skjermen er strukket nedover", () => {
    const ramme = { left: 10, top: 20, width: 100, height: 160 };
    const p = lerretPunkt(60, 100, ramme, 200, 200);
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(100);
  });

  it("treffer midten når fingeren er i midten av rammen", () => {
    const ramme = { left: 0, top: 40, width: 180, height: 220 };
    const p = lerretPunkt(90, 150, ramme, 180, 180);
    expect(p.x).toBeCloseTo(90);
    expect(p.y).toBeCloseTo(90);
  });
});
