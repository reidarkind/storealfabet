import { describe, expect, it } from "vitest";
import { giBelonning, melkForVerdi, miltTap, tomLomme, verdi } from "./okonomi";

describe("okonomi", () => {
  it("regner verdi som krystaller + 2 diamanter", () => {
    expect(verdi({ krystaller: 3, diamanter: 4 })).toBe(11);
  });

  it("velger melk etter terskler", () => {
    expect(melkForVerdi(0)).toBe("vanlig");
    expect(melkForVerdi(3)).toBe("vanlig");
    expect(melkForVerdi(4)).toBe("jordbaer");
    expect(melkForVerdi(8)).toBe("sjokolade");
    expect(melkForVerdi(12)).toBe("stjerne");
  });

  it("gir belønning uten å mutere originalen", () => {
    const start = tomLomme();
    expect(giBelonning(start, "krystall")).toEqual({ krystaller: 1, diamanter: 0 });
    expect(giBelonning(start, "diamant")).toEqual({ krystaller: 0, diamanter: 1 });
    expect(start).toEqual({ krystaller: 0, diamanter: 0 });
  });

  it("tar krystaller først ved mildt tap og går aldri under null", () => {
    expect(miltTap({ krystaller: 2, diamanter: 1 }, 1)).toEqual({
      krystaller: 1,
      diamanter: 1,
    });
    expect(miltTap({ krystaller: 0, diamanter: 1 }, 2)).toEqual({
      krystaller: 0,
      diamanter: 0,
    });
    expect(miltTap({ krystaller: 0, diamanter: 0 }, 2)).toEqual({
      krystaller: 0,
      diamanter: 0,
    });
  });
});
