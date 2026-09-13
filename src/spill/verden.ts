import Phaser from "phaser";

export const VERDEN_HOYDE = 0.46;

export type BakgrunnFase = "hjem" | "sti" | "skole";

export class VerdenScene extends Phaser.Scene {
  private alf?: Phaser.GameObjects.Image;
  private zombie?: Phaser.GameObjects.Image;
  private himmel?: Phaser.GameObjects.Rectangle;
  private maane?: Phaser.GameObjects.Arc;
  private skole?: Phaser.GameObjects.Container;
  private sti?: Phaser.GameObjects.Graphics;
  private bobler?: Phaser.Tweens.Tween;

  constructor() {
    super("verden");
  }

  preload(): void {
    this.load.svg("alf", `${import.meta.env.BASE_URL}alf.svg`, { width: 220, height: 220 });
    this.load.svg("zombie", `${import.meta.env.BASE_URL}zombie.svg`, { width: 220, height: 220 });
  }

  create(): void {
    const { width, height } = this.scale;
    this.himmel = this.add.rectangle(width / 2, height / 2, width, height, 0x1b1633);
    this.maane = this.add.circle(width * 0.82, height * 0.18, 28, 0xf8e7b0).setAlpha(0.9);
    this.sti = this.add.graphics();
    this.tegnSti(width, height, 0);
    this.tegnTrar(width, height);
    this.skole = this.lagSkole(width, height);
    this.alf = this.add.image(this.xForStopp(1, width), height * 0.72, "alf").setScale(0.72).setDepth(5);
    this.zombie = this.add
      .image(width + 80, height * 0.7, "zombie")
      .setScale(0.7)
      .setDepth(4)
      .setAlpha(0);
    this.bobleAlf();
    this.scale.on("resize", (storrelse: Phaser.Structs.Size) => {
      this.vedEndring(storrelse);
    });
  }

  settFase(stopp: number): void {
    const { width, height } = this.scale;
    const t = (stopp - 1) / 5;
    const natt = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x1b1633),
      Phaser.Display.Color.ValueToColor(0x7eb6d9),
      100,
      Math.round(t * 100),
    );
    this.himmel?.setFillStyle(Phaser.Display.Color.GetColor(natt.r, natt.g, natt.b));
    this.maane?.setAlpha(1 - t * 0.75);
    this.tegnSti(width, height, t);
  }

  async gaaTilStopp(stopp: number): Promise<void> {
    if (!this.alf) return;
    this.settFase(stopp);
    const { width, height } = this.scale;
    const x = this.xForStopp(stopp, width);
    await this.tweenPromise({
      targets: this.alf,
      x,
      y: height * 0.72 + Math.sin(stopp) * 6,
      duration: 900,
      ease: "Sine.easeInOut",
    });
  }

  async visZombie(): Promise<void> {
    if (!this.zombie || !this.alf) return;
    const { height } = this.scale;
    this.zombie.setAlpha(1).setX(this.alf.x + 150).setY(height * 0.7);
    await this.tweenPromise({
      targets: this.zombie,
      x: this.alf.x + 88,
      duration: 500,
      ease: "Back.easeOut",
    });
  }

  async gjemZombie(vant: boolean): Promise<void> {
    if (!this.zombie) return;
    await this.tweenPromise({
      targets: this.zombie,
      x: vant ? this.zombie.x + 160 : this.zombie.x + 40,
      y: vant ? this.zombie.y + 20 : this.zombie.y,
      angle: vant ? 18 : -8,
      alpha: 0,
      duration: 550,
      ease: "Quad.easeIn",
    });
    this.zombie.setAngle(0);
  }

  feir(): void {
    if (!this.alf) return;
    this.tweens.add({
      targets: this.alf,
      y: this.alf.y - 18,
      yoyo: true,
      repeat: 3,
      duration: 180,
    });
  }

  private xForStopp(stopp: number, width: number): number {
    const start = width * 0.12;
    const slutt = width * 0.78;
    return start + ((stopp - 1) / 5) * (slutt - start);
  }

  private tegnSti(width: number, height: number, lys: number): void {
    if (!this.sti) return;
    this.sti.clear();
    const y = height * 0.82;
    this.sti.fillStyle(0x3a2a1c, 1);
    this.sti.fillRoundedRect(0, y, width, height - y + 8, 0);
    this.sti.fillStyle(Phaser.Display.Color.GetColor(90 + lys * 50, 70 + lys * 30, 42), 1);
    this.sti.fillRoundedRect(0, y - 18, width, 28, 12);
    this.sti.lineStyle(4, 0xf4d27a, 0.45);
    this.sti.beginPath();
    this.sti.moveTo(16, y - 6);
    this.sti.lineTo(width - 16, y - 6);
    this.sti.strokePath();
  }

  private tegnTrar(width: number, height: number): void {
    const graf = this.add.graphics();
    for (let i = 0; i < 6; i++) {
      const x = width * (0.08 + i * 0.16);
      graf.fillStyle(0x2a1848, 0.85);
      graf.fillRect(x - 6, height * 0.42, 12, height * 0.38);
      graf.fillStyle(0x1f3d2c, 0.9);
      graf.fillCircle(x, height * 0.4, 28 + (i % 3) * 6);
    }
  }

  private lagSkole(width: number, height: number): Phaser.GameObjects.Container {
    const hus = this.add.rectangle(0, 0, 70, 52, 0xc45c4a);
    const tak = this.add.triangle(0, -38, -42, 10, 42, 10, 0, -28, 0x6b2d3c);
    const dor = this.add.rectangle(0, 12, 16, 24, 0xf4d27a);
    const vindu = this.add.rectangle(-20, -4, 12, 12, 0xf8e7b0);
    const vindu2 = this.add.rectangle(20, -4, 12, 12, 0xf8e7b0);
    return this.add.container(width * 0.88, height * 0.58, [tak, hus, dor, vindu, vindu2]).setDepth(3);
  }

  private bobleAlf(): void {
    if (!this.alf) return;
    this.bobler?.stop();
    this.bobler = this.tweens.add({
      targets: this.alf,
      y: "+=6",
      yoyo: true,
      repeat: -1,
      duration: 700,
      ease: "Sine.easeInOut",
    });
  }

  private vedEndring(storrelse: Phaser.Structs.Size): void {
    this.himmel?.setSize(storrelse.width, storrelse.height).setPosition(storrelse.width / 2, storrelse.height / 2);
    this.maane?.setPosition(storrelse.width * 0.82, storrelse.height * 0.18);
    this.skole?.setPosition(storrelse.width * 0.88, storrelse.height * 0.58);
    if (this.alf) this.alf.setY(storrelse.height * 0.72);
  }

  private tweenPromise(config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((resolve) => {
      this.tweens.add({
        ...config,
        onComplete: () => resolve(),
      });
    });
  }
}

export function lagSpill(forelder: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: forelder,
    backgroundColor: "#1b1633",
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: forelder.clientWidth || 390,
      height: Math.max(220, Math.round(window.innerHeight * VERDEN_HOYDE)),
    },
    scene: [VerdenScene],
    audio: { noAudio: true },
  });
}

export function hentVerden(spill: Phaser.Game): VerdenScene | undefined {
  const scene = spill.scene.getScene("verden");
  return scene instanceof VerdenScene ? scene : undefined;
}
