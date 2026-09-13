const STI_SEKUNDER = 40;
export const VEI_SIKT = 8;

export interface VeiPunkt {
  cx: number;
  cy: number;
  halv: number;
}

export interface Prosjekt {
  left: number;
  top: number;
  skala: number;
  synlig: boolean;
}

function klem(verdi: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, verdi));
}

export function veiAvstand(tid: number): number {
  return (STI_SEKUNDER - tid) * 1.35;
}

export function distFraZ(z: number, tid: number): number {
  return veiAvstand(tid) + (1 - klem(z)) * VEI_SIKT;
}

export function zFraDist(dist: number, tid: number): number {
  return 1 - (dist - veiAvstand(tid)) / VEI_SIKT;
}

export function perspektivT(z: number): number {
  return klem(z) ** 1.75;
}

export function veiSvingVed(dist: number): number {
  return Math.sin(dist * 0.42) * 0.55 + Math.sin(dist * 0.13) * 0.28;
}

export function veiBakkeVed(dist: number): number {
  return Math.sin(dist * 0.33) * 0.7 + Math.sin(dist * 0.09) * 0.32;
}

export function veiEndeZ(): number {
  return 0.06;
}

export function veiPunktDist(dist: number, tid: number): VeiPunkt {
  const z = zFraDist(dist, tid);
  const t = perspektivT(z);
  const sving = veiSvingVed(dist);
  const bakke = veiBakkeVed(dist);
  const horX = 50 + veiSvingVed(distFraZ(0, tid)) * 26;
  const horY = klem(20 + veiBakkeVed(distFraZ(0.12, tid)) * 9 - veiBakkeVed(distFraZ(1, tid)) * 5, 12, 24);
  const cx = horX + (50 - horX) * t + sving * t * (1 - t) * 46;
  const cy = horY + (96 - horY) * t - bakke * t * (1 - t) * 44;
  const halv = 1.8 + t * 48;
  return { cx, cy, halv };
}

export function veiPunkt(z: number, tid: number): VeiPunkt {
  return veiPunktDist(distFraZ(z, tid), tid);
}

export function bakomBakke(z: number, tid: number): boolean {
  if (z < 0.05) return true;
  const her = veiBakkeVed(distFraZ(z, tid));
  const kamera = veiBakkeVed(distFraZ(1, tid));
  if (kamera > 0.2 && z < 0.2 + kamera * 0.18) return true;
  for (let s = z + 0.08; s < 0.94; s += 0.05) {
    if (veiBakkeVed(distFraZ(s, tid)) > her + 0.22) return true;
  }
  return false;
}

export function prosjektDist(x: number, dist: number, tid: number, skjulBakBakke = true): Prosjekt {
  const z = zFraDist(dist, tid);
  const vei = veiPunktDist(dist, tid);
  const t = perspektivT(z);
  return {
    left: vei.cx + (x - 0.5) * 2 * vei.halv,
    top: vei.cy,
    skala: 0.02 + t * 1.35,
    synlig: z > veiEndeZ() && z < 1.18 && t > 0.008 && !(skjulBakBakke && bakomBakke(z, tid)),
  };
}

export function prosjektPunkt(x: number, z: number, tid: number, skjulBakBakke = true): Prosjekt {
  return prosjektDist(x, distFraZ(z, tid), tid, skjulBakBakke);
}

export function prosjektDekor(side: -1 | 1, dist: number, tid: number): Prosjekt {
  return prosjektDist(side < 0 ? -0.16 : 1.16, dist, tid);
}

export function turFramgang(tid: number, etappe = 1, antallStopp = 6): number {
  const iEtappe = klem(1 - tid / STI_SEKUNDER);
  return klem((etappe - 1 + iEtappe) / Math.max(1, antallStopp));
}

export function skolePunkt(tid: number, etappe = 1, antallStopp = 6): Prosjekt {
  const fram = turFramgang(tid, etappe, antallStopp);
  const vei = veiPunkt(veiEndeZ(), tid);
  return {
    left: vei.cx,
    top: vei.cy,
    skala: 0.16 + fram * 1.85,
    synlig: true,
  };
}
