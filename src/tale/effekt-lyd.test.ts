import { describe, expect, it } from "vitest";
import { lagEffektWav } from "./effekt-lyd";

describe("lagEffektWav", () => {
  it("lager tom blob uten toner", () => {
    expect(lagEffektWav([]).size).toBe(0);
  });

  it("lager gyldig WAV med RIFF-hode", async () => {
    const blob = lagEffektWav([{ type: "sine", frekvens: 880, start: 0, varighet: 0.1, volum: 0.08 }]);
    expect(blob.size).toBeGreaterThan(44);
    expect(blob.type).toBe("audio/wav");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe("RIFF");
    expect(String.fromCharCode(...bytes.slice(8, 12))).toBe("WAVE");
  });

  it("blander flere toner til én lengre lyd", () => {
    const kort = lagEffektWav([{ type: "sine", frekvens: 440, start: 0, varighet: 0.05, volum: 0.1 }]);
    const lang = lagEffektWav([
      { type: "sine", frekvens: 440, start: 0, varighet: 0.05, volum: 0.1 },
      { type: "sine", frekvens: 880, start: 0.2, varighet: 0.05, volum: 0.1 },
    ]);
    expect(lang.size).toBeGreaterThan(kort.size);
  });
});
