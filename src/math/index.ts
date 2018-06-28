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

// mod account for negatives
export function mod(t: number, m: number) {
    return ((t % m) + m) % m;
}

// perfect triangle wave that goes from [0, 1, 0] in x = [0, 1, 2]
export function mirroredRepeat(x: number) {
  return (1. - (Math.abs(mod(x * 2., 4.) - 2.) - 1.)) / 2.;
}

export function logistic(x: number) {
    if (x < -6) {
        return 0;
    } else if (x > 6) {
        return 1;
    }
    return 1 / (1 + Math.exp(-x));
}
