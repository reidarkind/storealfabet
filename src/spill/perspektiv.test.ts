import { describe, expect, it } from "vitest";
import { bakomBakke, prosjektPunkt, veiAvstand, veiPunkt } from "./perspektiv";

describe("perspektiv", () => {
  it("legger stein på veien ved forsvinningspunktet, ikke i himmelen", () => {
    const hor = veiPunkt(0.02, 40);
    const stein = prosjektPunkt(0.5, 0.08, 40);
    expect(stein.top).toBeGreaterThanOrEqual(hor.cy - 1);
    expect(stein.top).toBeLessThan(40);
    expect(stein.skala).toBeLessThan(prosjektPunkt(0.5, 0.9, 40).skala);
  });

  it("lar steiner i samme dybde ligge på samme veibredde", () => {
    const venstre = prosjektPunkt(0.2, 0.7, 40);
    const hoyre = prosjektPunkt(0.8, 0.7, 40);
    expect(venstre.top).toBeCloseTo(hoyre.top, 5);
    expect(venstre.left).toBeLessThan(hoyre.left);
  });

  it("svinger veiens endepunkt over tid", () => {
    expect(veiPunkt(0.04, 40).cx).not.toBeCloseTo(veiPunkt(0.04, 30).cx, 0);
    expect(veiAvstand(30)).toBeGreaterThan(veiAvstand(40));
  });

  it("hever og senker horisonten i bakker", () => {
    const hoyder = [40, 36, 32, 28, 24, 20].map((tid) => veiPunkt(0.08, tid).cy);
    expect(Math.max(...hoyder) - Math.min(...hoyder)).toBeGreaterThan(3);
  });

  it("skjuler det som ligger bak en bakketopp", () => {
    const skjult = Array.from({ length: 90 }, (_, i) => 40 - i * 0.4).some((tid) => bakomBakke(0.1, tid));
    expect(skjult).toBe(true);
  });
});
