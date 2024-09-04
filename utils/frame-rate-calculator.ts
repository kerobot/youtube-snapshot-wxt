export class FrameRateCalculator {
    private lastFrameTime: number;
    private frameTimes: number[];
    private frameRate: number;
  
    constructor() {
        this.lastFrameTime = performance.now();
        this.frameTimes = [];
        this.frameRate = 0;
        this.calculateFrameRate();
    }
  
    private calculateFrameRate(): void {
        const now = performance.now();
        const delta = now - this.lastFrameTime;
        this.lastFrameTime = now;
        this.frameTimes.push(delta);
        if (this.frameTimes.length > 100) {
            this.frameTimes.shift();
        }
        const averageDelta = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        this.frameRate = 1000 / averageDelta;
        requestAnimationFrame(this.calculateFrameRate.bind(this));
    }
  
    public getFrameRate(): number {
        return this.frameRate;
    }
}
