import { describe, expect, it } from "vitest";
import {
  ANTALL_STOPP,
  avsluttDuell,
  avsluttTur,
  duellFerdig,
  duellVunnet,
  harZombie,
  nesteStopp,
  registrerDuellSvar,
  registrerOppgaveSvar,
  startDuell,
  startTur,
  velgZombieStopp,
} from "./tur";

describe("tur", () => {
  it("har aldri zombie på stopp 1 og maks to dueller", () => {
    for (let i = 0; i < 20; i++) {
      const stopp = velgZombieStopp(() => (i + 1) * 0.17);
      expect(stopp).not.toContain(1);
      expect(stopp).toHaveLength(2);
      expect(new Set(stopp).size).toBe(2);
      for (const s of stopp) {
        expect(s).toBeGreaterThanOrEqual(2);
        expect(s).toBeLessThanOrEqual(6);
      }
    }
  });

  it("går seks stopp og blir ferdig", () => {
    let tur = startTur({ nivaa: "forste", lydPa: true, sekk: "lilla", stemme: "" }, () => 0.1);
    expect(tur.stopp).toBe(1);
    for (let i = 1; i < ANTALL_STOPP; i++) {
      tur = nesteStopp(tur);
    }
    expect(tur.stopp).toBe(6);
    expect(tur.ferdig).toBe(false);
    tur = nesteStopp(tur);
    expect(tur.ferdig).toBe(true);
  });

  it("øker og minker lomme og går aldri negativ", () => {
    let tur = startTur({ nivaa: "forste", lydPa: true, sekk: "lilla", stemme: "" }, () => 0.2);
    tur = registrerOppgaveSvar(tur, true, "krystall");
    tur = registrerOppgaveSvar(tur, true, "diamant");
    expect(tur.lomme).toEqual({ krystaller: 1, diamanter: 1 });
    tur = registrerOppgaveSvar(tur, false, "krystall");
    expect(tur.lomme.krystaller).toBe(0);
    tur = { ...tur, lomme: { krystaller: 0, diamanter: 0 } };
    tur = registrerOppgaveSvar(tur, false, "krystall");
    expect(tur.lomme).toEqual({ krystaller: 0, diamanter: 0 });
  });

  it("duell vinnes med to av tre og gir diamant", () => {
    let tur = startTur({ nivaa: "andre", lydPa: true, sekk: "lilla", stemme: "" }, () => 0.3);
    tur = startDuell(tur);
    tur = registrerDuellSvar(tur, true);
    tur = registrerDuellSvar(tur, false);
    tur = registrerDuellSvar(tur, true);
    expect(duellFerdig(tur)).toBe(true);
    expect(duellVunnet(tur)).toBe(true);
    tur = avsluttDuell(tur);
    expect(tur.lomme.diamanter).toBe(1);
  });

  it("melk følger verdi", () => {
    const tur = startTur({ nivaa: "forste", lydPa: true, sekk: "lilla", stemme: "" }, () => 0.4);
    expect(avsluttTur({ ...tur, lomme: { krystaller: 0, diamanter: 0 } }).melk).toBe("vanlig");
    expect(avsluttTur({ ...tur, lomme: { krystaller: 4, diamanter: 0 } }).melk).toBe("jordbaer");
    expect(avsluttTur({ ...tur, lomme: { krystaller: 0, diamanter: 4 } }).melk).toBe("sjokolade");
    expect(avsluttTur({ ...tur, lomme: { krystaller: 4, diamanter: 4 } }).melk).toBe("stjerne");
    expect(avsluttTur({ ...tur, skitten: true }).skitten).toBe(true);
  });

  it("harZombie følger planen", () => {
    const tur = startTur({ nivaa: "forste", lydPa: true, sekk: "lilla", stemme: "" }, () => 0.9);
    expect(harZombie({ ...tur, stopp: 1 })).toBe(false);
  });
});
