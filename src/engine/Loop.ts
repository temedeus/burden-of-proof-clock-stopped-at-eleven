export class Loop {
  private last = 0;

  start(callback: (dt: number) => void) {
    const frame = (time: number) => {
      const dt = (time - this.last) / 1000;
      this.last = time;
      callback(dt);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}
