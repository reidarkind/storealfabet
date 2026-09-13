const STI_SEKUNDER = 40;

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

export function perspektivT(z: number): number {
  return klem(z) ** 1.75;
}

export function veiSving(z: number, tid: number): number {
  const d = veiAvstand(tid) + (1 - klem(z)) * 9;
  return Math.sin(d * 0.42) * 0.55 + Math.sin(d * 0.13) * 0.28;
}

export function veiBakke(z: number, tid: number): number {
  const d = veiAvstand(tid) + (1 - klem(z)) * 7.2;
  return Math.sin(d * 0.33) * 0.7 + Math.sin(d * 0.09) * 0.32;
}

export function veiPunkt(z: number, tid: number): VeiPunkt {
  const t = perspektivT(z);
  const sving = veiSving(z, tid);
  const bakke = veiBakke(z, tid);
  const horX = 50 + veiSving(0, tid) * 26;
  const horY = 20 + veiBakke(0.12, tid) * 9 - veiBakke(1, tid) * 5;
  const cx = horX + (50 - horX) * t + sving * t * (1 - t) * 46;
  const cy = horY + (96 - horY) * t - bakke * t * (1 - t) * 44;
  const halv = 1.8 + t * 48;
  return { cx, cy, halv };
}

export function bakomBakke(z: number, tid: number): boolean {
  if (z < 0.05) return true;
  const her = veiBakke(z, tid);
  const kamera = veiBakke(1, tid);
  if (kamera > 0.2 && z < 0.2 + kamera * 0.18) return true;
  for (let s = z + 0.08; s < 0.94; s += 0.05) {
    if (veiBakke(s, tid) > her + 0.22) return true;
  }
  return false;
}

export function prosjektPunkt(x: number, z: number, tid: number): Prosjekt {
  const vei = veiPunkt(z, tid);
  const t = perspektivT(z);
  return {
    left: vei.cx + (x - 0.5) * 2 * vei.halv,
    top: vei.cy,
    skala: 0.1 + t * 1.22,
    synlig: t > 0.03 && !bakomBakke(z, tid),
  };
}

export function prosjektDekor(side: -1 | 1, z: number, tid: number): Prosjekt {
  return prosjektPunkt(side < 0 ? -0.16 : 1.16, z, tid);
}
