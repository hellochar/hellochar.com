import * as THREE from "three";

import { SuperPoint } from "./superPoint";

export interface UpdateVisitor {
    visit(point: SuperPoint): void;
}

export class VelocityTrackerVisitor implements UpdateVisitor {
    public velocity = 0;
    public numVisited = 0;

    public visit(p: SuperPoint) {
        this.velocity += p.lastPoint.distanceTo(p.point);
        this.numVisited++;
    }

    public computeVelocity() {
        if (this.numVisited === 0) {
            return 0;
        }
        return this.velocity / this.numVisited;
    }
}

export class LengthVarianceTrackerVisitor implements UpdateVisitor {
    public varianceNumSamples = 0;
    public varianceSum = 0;
    public varianceSumSq = 0;

    public variance = 0;

    public visit(p: SuperPoint) {
        const lengthSq = p.point.lengthSq();
        this.varianceNumSamples++;
        this.varianceSum += Math.sqrt(lengthSq);
        this.varianceSumSq += lengthSq;
    }

    public computeVariance() {
        const { varianceSumSq, varianceSum, varianceNumSamples } = this;
        if (this.varianceNumSamples === 0) {
            return 0;
        }
        // can go as high as 15 - 20, as low as 0.1
        return (varianceSumSq - (varianceSum * varianceSum) / varianceNumSamples) / (varianceNumSamples - 1);
    }
}

export type BoxHash = { [boxCorner: string]: number };
export class BoxCountVisitor implements UpdateVisitor {
    public boxHashes: BoxHash[];
    public counts: number[];
    public densities: number[];

    public constructor(public sideLengths: number[]) {
        this.boxHashes = sideLengths.map( () => ({}) );
        this.counts = sideLengths.map(() => 0);
        this.densities = sideLengths.map(() => 0);
    }

    private temp = new THREE.Vector3();
    public visit(p: SuperPoint) {
        const { sideLengths, boxHashes, temp, counts, densities } = this;

        for (let idx = 0, sll = sideLengths.length; idx < sll; idx++) {
            const sideLength = sideLengths[idx];
            const boxHash = boxHashes[idx];
            // round to nearest sideLength interval on x/y/z
            // e.g. for side length 2
            // [0 to 2) -> 0
            // [2 to 4) -> 2
            temp.copy(p.point).divideScalar(sideLength).floor().multiplyScalar(sideLength);
            const hash = `${temp.x},${temp.y},${temp.z}`;
            if (!boxHash[hash]) {
                boxHash[hash] = 1;
                counts[idx]++;
                densities[idx] += 1;
            } else {
                // approximates boxHash^2
                // we have the sequence 1, 2, 3, 4, 5, ...n
                // assume we've gotten n^2 contribution.
                // now we want to get to (n+1)^2 contribution. What do we add?
                // (n+1)^2 - n^2 = (n+1)*(n+1) - n^2 = n^2 + 2n + 1 - n^2 = 2n + 1
                densities[idx] += 2 * boxHash[hash] + 1;
                boxHash[hash]++;
            }
        }
    }

    public computeCountAndCountDensity() {
        const { counts, densities, sideLengths } = this;

        // so we have three data points:
        // { volume: 1, count: 11 }, { volume: 1e-3, count: 341 }, { volume: 1e-6, count: 15154 }
        // the formula is roughly count = C * side^dimension
        // lets just log both of them
        // log(count) = dimesion*log(C*side); linear regression out the C*side to get the dimension
        const logSideLengths = sideLengths.map((sideLength) => Math.log(sideLength));
        const logCounts = counts.map((count) => Math.log(count));
        const logDensities = densities.map((density) => Math.log(density));

        const slopeCount = -this.linearRegressionSlope(logSideLengths, logCounts);
        const slopeDensity = -this.linearRegressionSlope(logSideLengths, logDensities);

        // count ranges from 0.5 in the extremely shunken case (aaaaa) to 2.8 in a really spaced out case
        // much of it is ~2; anything < 1.7 is very linear/1D

        // countDensity ranges from 3.5 (adsfadsfa) really spaced out to ~6 which is extremely tiny
        // much of it ranges from 3.5 to like 4.5
        // it's a decent measure of how "dense" the fractal is
        return [slopeCount, slopeDensity];
    }

    private linearRegressionSlope(xs: number[], ys: number[]) {
        const xAvg = xs.reduce((sum, x) => sum + x, 0);
        const yAvg = ys.reduce((sum, y) => sum + y, 0);
        const denominator = xs.reduce((sum, x) => (x - xAvg) * (x - xAvg), 0);
        const numerator = xs.reduce((sum, x, idx) => (x - xAvg) * (ys[idx] - yAvg), 0);
        return numerator / denominator;
    }
}

