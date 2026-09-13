import { describe, expect, it } from "vitest";
import { bakomBakke, prosjektDist, prosjektPunkt, skolePunkt, veiAvstand, veiPunkt, veiPunktDist, veiSvingVed, zFraDist } from "./perspektiv";

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

  it("limer et hus til samme sving på veien når kameraet kjører", () => {
    const dist = 6;
    expect(veiSvingVed(dist)).toBe(veiSvingVed(dist));
    const forst = prosjektDist(0.2, dist, 40);
    const vei = veiPunktDist(dist, 40);
    expect(forst.left).toBeCloseTo(vei.cx + (0.2 - 0.5) * 2 * vei.halv, 5);
    expect(zFraDist(dist, 36)).toBeGreaterThan(zFraDist(dist, 40));
    const senere = prosjektDist(0.2, dist, 36);
    const vei2 = veiPunktDist(dist, 36);
    expect(senere.left).toBeCloseTo(vei2.cx + (0.2 - 0.5) * 2 * vei2.halv, 5);
  });

  it("setter skolen på veien i det fjerne", () => {
    const start = skolePunkt(40, 1);
    expect(start.synlig).toBe(true);
    expect(start.top).toBeGreaterThan(10);
    expect(start.top).toBeLessThan(50);
    expect(start.skala).toBeLessThan(0.7);
  });

  it("lar skolen komme nærmere gjennom turen til Alf er framme", () => {
    const start = skolePunkt(40, 1);
    const midt = skolePunkt(20, 3);
    const slutt = skolePunkt(0, 6);
    expect(midt.skala).toBeGreaterThan(start.skala);
    expect(slutt.skala).toBeGreaterThan(midt.skala);
    expect(slutt.top).toBeGreaterThan(start.top + 20);
    expect(slutt.top).toBeGreaterThan(70);
    expect(skolePunkt(0, 1).skala).toBeGreaterThan(start.skala);
    expect(skolePunkt(40, 6).skala).toBeGreaterThan(skolePunkt(40, 5).skala);
  });
});
