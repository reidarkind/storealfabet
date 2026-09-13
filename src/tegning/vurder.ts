export interface Raster {
  bredde: number;
  hoyde: number;
  maske: boolean[];
}

export function rasterFraAlpha(data: Uint8ClampedArray, bredde: number, hoyde: number, terskel = 40): Raster {
  const maske: boolean[] = [];
  for (let i = 3; i < data.length; i += 4) {
    maske.push((data[i] ?? 0) > terskel);
  }
  return { bredde, hoyde, maske };
}

export function vurderTegning(strek: Raster, omriss: Raster, minDekning = 0.32, maksSøl = 1.35): boolean {
  if (strek.bredde !== omriss.bredde || strek.hoyde !== omriss.hoyde) {
    return false;
  }
  let omrissPiksler = 0;
  let truffet = 0;
  let strekPiksler = 0;
  for (let i = 0; i < omriss.maske.length; i++) {
    const o = omriss.maske[i];
    const s = strek.maske[i];
    if (o) {
      omrissPiksler += 1;
      if (s) truffet += 1;
    }
    if (s) strekPiksler += 1;
  }
  if (omrissPiksler === 0 || strekPiksler < 8) {
    return false;
  }
  const dekning = truffet / omrissPiksler;
  const sol = strekPiksler / omrissPiksler;
  return dekning >= minDekning && sol <= maksSøl;
}

export function tomtRaster(bredde: number, hoyde: number): Raster {
  return { bredde, hoyde, maske: Array.from({ length: bredde * hoyde }, () => false) };
}

export function fyllSirkel(bredde: number, hoyde: number, cx: number, cy: number, r: number): Raster {
  const maske: boolean[] = [];
  for (let y = 0; y < hoyde; y++) {
    for (let x = 0; x < bredde; x++) {
      const dx = x - cx;
      const dy = y - cy;
      maske.push(dx * dx + dy * dy <= r * r);
    }
  }
  return { bredde, hoyde, maske };
}
