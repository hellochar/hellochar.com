export function lerp(a: number, b: number, x: number) {
    return a + (b - a) * x;
}

export function map(x: number, xStart: number, xStop: number, yStart: number, yStop: number) {
    return lerp(yStart, yStop, (x - xStart) / (xStop - xStart));
}

export function sampleArray<T>(a: T[]) {
    return a[Math.floor(Math.random() * a.length)];
}
