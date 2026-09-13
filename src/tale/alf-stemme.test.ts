import { describe, expect, it } from "vitest";
import { medTidsfrist } from "./alf-stemme";

describe("alf-stemme", () => {
  it("gir opp hvis stemmen bruker for lang tid", async () => {
    await expect(medTidsfrist(new Promise(() => {}), 20)).rejects.toThrow("tid");
  });

  it("lar ferdig jobb gå gjennom", async () => {
    await expect(medTidsfrist(Promise.resolve("ok"), 200)).resolves.toBe("ok");
  });
});
