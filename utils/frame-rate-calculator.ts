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
  
    // フレームレートを計算する
    private calculateFrameRate(): void {
        // 現在時刻と前回のフレーム時刻の差を100件まで保持して平均フレーム間隔を計算
        const now = performance.now();
        const delta = now - this.lastFrameTime;
        this.lastFrameTime = now;
        this.frameTimes.push(delta);
        if (this.frameTimes.length > 100) {
            this.frameTimes.shift();
        }
        const averageDelta = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        // 1秒 = 1000ms / 平均フレーム間隔 = 疑似FPSとする
        this.frameRate = 1000 / averageDelta;
        // 次のフレームレート計算をリクエストする
        requestAnimationFrame(this.calculateFrameRate.bind(this));
    }
  
    // フレームレートを取得する
    public getFrameRate(): number {
        return this.frameRate;
    }
}
