export function lerp(a: number, b: number, x: number) {
    return a + (b - a) * x;
}

export function map(x: number, xStart: number, xStop: number, yStart: number, yStop: number) {
    return lerp(yStart, yStop, (x - xStart) / (xStop - xStart));
}

export function sampleArray<T>(a: T[]) {
    return a[Math.floor(Math.random() * a.length)];
}

export function triangleWaveApprox(t: number) {
    return 8 / (Math.PI * Math.PI) * (Math.sin(t) - (1 / 9) * Math.sin(3 * t) + (1 / 25) * Math.sin(5 * t));
}
