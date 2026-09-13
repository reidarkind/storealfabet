export class SvarVakt {
  private aapen = true;

  godta(): boolean {
    if (!this.aapen) return false;
    this.aapen = false;
    return true;
  }

  slipp(): void {
    this.aapen = true;
  }
}
