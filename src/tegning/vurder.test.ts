import { describe, expect, it } from "vitest";
import { fyllSirkel, tomtRaster, vurderTegning } from "./vurder";

describe("tegning", () => {
  it("godtar nesten full dekning av omrisset", () => {
    const omriss = fyllSirkel(20, 20, 10, 10, 6);
    const strek = fyllSirkel(20, 20, 10, 10, 5);
    expect(vurderTegning(strek, omriss)).toBe(true);
  });

  it("avviser tom strek og krusedull utenfor", () => {
    const omriss = fyllSirkel(20, 20, 10, 10, 6);
    expect(vurderTegning(tomtRaster(20, 20), omriss)).toBe(false);
    const sol = fyllSirkel(20, 20, 2, 2, 8);
    expect(vurderTegning(sol, omriss)).toBe(false);
  });
});
