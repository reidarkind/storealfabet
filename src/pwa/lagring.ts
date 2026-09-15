export type LagringMotor = {
  persisted?: () => Promise<boolean>;
  persist: () => Promise<boolean>;
};

export function hentLagringMotor(): LagringMotor | null {
  const storage = globalThis.navigator?.storage;
  if (!storage || typeof storage.persist !== "function") return null;
  return storage;
}

/** Ber nettleseren om å ikke slette cache, Alf-stemme og rekorder under lagringstrykk. */
export async function beVarigLagring(motor: LagringMotor | null = hentLagringMotor()): Promise<boolean> {
  if (!motor) return false;
  try {
    if (typeof motor.persisted === "function" && (await motor.persisted())) return true;
    return await motor.persist();
  } catch {
    return false;
  }
}
