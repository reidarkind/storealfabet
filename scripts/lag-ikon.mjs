import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const rot = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(rot, "public", "ikon.svg"));

for (const [navn, storrelse] of [
  ["ikon-192.png", 192],
  ["ikon-512.png", 512],
  ["apple-touch-icon.png", 180],
]) {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: storrelse } }).render().asPng();
  writeFileSync(join(rot, "public", navn), png);
}
