// import * as OrbitControls from "imports-loader?THREE=three!exports-loader?THREE.OrbitControls!three-examples/controls/OrbitControls";
import { parse } from "query-string";
import { KeyboardEvent, MouseEvent } from "react";
import * as React from "react";
import * as THREE from "three";

import { createPinkNoise, createWhiteNoise } from "../audio/noise";
import { lerp, map, sampleArray } from "../math";
import { ISketch, SketchAudioContext } from "../sketch";

type Transform = (point: THREE.Vector3) => void;

interface Branch {
    color: THREE.Color;
    affine: Transform;
    variation: Transform;
}

const AFFINES = {
    // lerp halfway towards the origin, biased by -1
    TowardsOriginNegativeBias: (point: THREE.Vector3) => {
        point.set( (point.x - 1) / 2 + 0.25, (point.y - 1) / 2, point.z / 2);
    },
    // lerp towards the origin, biasing x by 1, y by -1
    TowardsOrigin2: (point: THREE.Vector3) => {
        point.set( (point.x + 1) / 2, (point.y - 1) / 2 - 0.1, (point.z + 1) / 2 - 0.1);
    },
    Swap: (point: THREE.Vector3) => {
        point.set((point.y + point.z) / 2.5, (point.x + point.z) / 2.5, (point.x + point.y) / 2.5);
    },
    SwapSub: (point: THREE.Vector3) => {
        point.set((point.y - point.z) / 2, (point.z - point.x) / 2, (point.x - point.y) / 2);
    },
    Negate: (point: THREE.Vector3) => {
        point.set(-point.x, -point.y, -point.z);
    },
    NegateSwap: (point: THREE.Vector3) => {
        point.set(
            (-point.x + point.y + point.z) / 2.1,
            (-point.y + point.x + point.z) / 2.1,
            (-point.z + point.x + point.y) / 2.1,
        );
    },
    Up1: (point: THREE.Vector3) => {
        point.set(point.x, point.y, point.z + 1);
    },
};

const VARIATIONS = {
    Linear: (point: THREE.Vector3) => {
        // no op
    },
    Sin: (point: THREE.Vector3) => {
        point.set(Math.sin(point.x), Math.sin(point.y), Math.sin(point.z));
    },
    Spherical: (point: THREE.Vector3) => {
        const lengthSq = point.lengthSq();
        if (lengthSq !== 0) {
            point.multiplyScalar(1 / lengthSq);
        }
    },
    Polar: (point: THREE.Vector3) => {
        point.set(Math.atan2(point.y, point.x) / Math.PI, point.length() - 1, Math.atan2(point.z, point.x));
    },
    Swirl: (point: THREE.Vector3) => {
        const r2 = point.lengthSq();
        point.set(point.z * Math.sin(r2) - point.y * Math.cos(r2),
                    point.x * Math.cos(r2) + point.z * Math.sin(r2),
                    point.x * Math.sin(r2) - point.y * Math.sin(r2),
                );
    },
    Normalize: (point: THREE.Vector3) => {
        // point.setLength(Math.sqrt(point.length()));
        point.normalize();
    },
    Shrink: (point: THREE.Vector3) => {
        point.setLength(Math.exp(-point.lengthSq()));
    },
};

function createInterpolatedVariation(variationA: Transform, variationB: Transform, interpolationFn: () => number) {
    return (pointA: THREE.Vector3) => {
        const pointB = pointA.clone();
        variationA(pointA);
        variationB(pointB);
        // if (Number.isNaN(pointA.lengthManhattan()) || Number.isNaN(pointB.lengthManhattan())) {
        //     debugger;
        // }
        const interpolatedAmount = interpolationFn();
        pointA.lerp(pointB, interpolatedAmount);
    };
}

function createRouterVariation(vA: Transform, vB: Transform, router: (p: THREE.Vector3) => boolean) {
    return (a: THREE.Vector3) => {
        const choice = router(a);
        if (choice) {
            vA(a);
        } else {
            vB(a);
        }
    };
}

/**
 * @param branch branch to apply
 * @param point point to apply to
 * @param color color to apply to
 */
function applyBranch(branch: Branch, point: THREE.Vector3, color: THREE.Color) {
    // apply the affine transform to the point
    branch.affine(point);
    point.x += cX / 5;
    point.y += cY / 5;

    // apply the nonlinear variation to the point
    branch.variation(point);

    // interpolate towards the affine color
    // color.lerp(affine.color, 0.5);
    color.add(branch.color);
}

interface UpdateVisitor {
    visit(point: SuperPoint): void;
}

class SuperPoint {
    public children: SuperPoint[];
    public lastPoint: THREE.Vector3 = new THREE.Vector3();

    constructor(
        public point: THREE.Vector3,
        public color: THREE.Color,
        public rootGeometry: THREE.Geometry,
        private branches: Branch[],
    ) {
        this.lastPoint.copy(point);
        rootGeometry.vertices.push(point);
        rootGeometry.colors.push(color);
    }

    public updateSubtree(depth: number, ...visitors: UpdateVisitor[]) {
        if (depth === 0) { return; }

        if (this.children === undefined) {
            this.children = this.branches.map(() => {
                return new SuperPoint(
                    new THREE.Vector3(),
                    new THREE.Color(0, 0, 0),
                    this.rootGeometry,
                    this.branches,
                );
            });
        }

        this.children.forEach((child, idx) => {
            const branch = this.branches[idx];
            // reset the child's position to your updated position so it's ready to get stepped
            child.lastPoint.copy(child.point);
            child.point.copy(this.point);
            child.color.copy(this.color);
            applyBranch(branch, child.point, child.color);

            // take far away points and move them into the center again to keep points from getting too out of hand
            if (child.point.lengthSq() > 50 * 50) {
                VARIATIONS.Spherical(child.point);
            }

            if (Math.random() < 0.01) {
                for (const v of visitors) {
                    v.visit(child);
                }
            }

            child.updateSubtree(depth - 1, ...visitors);
        });
    }

    public recalculate(initialPoint: number, depth: number, ...visitors: UpdateVisitor[]) {
        this.point.set(initialPoint, initialPoint, initialPoint);
        // console.time("updateSubtree");
        this.updateSubtree(depth, ...visitors);
        // console.timeEnd("updateSubtree");
    }
}

function randomBranches(name: string) {
    const numWraps = Math.floor(name.length / 5);
    const numBranches = Math.ceil(1 + name.length % 5 + numWraps);
    const branches: Branch[] = [];
    for (let i = 0; i < numBranches; i++) {
        const stringStart = map(i, 0, numBranches, 0, name.length);
        const stringEnd = map(i + 1, 0, numBranches, 0, name.length);
        const substring = name.substring(stringStart, stringEnd);
        branches.push(randomBranch(i, substring, numBranches, numWraps));
    }
    return branches;
}

// as low as 32 (for spaces)
// charCode - usually between 65 and 122
// other unicode languages could go up to 10k
const GEN_DIVISOR = 2147483648 - 1; // 2^31 - 1
function randomBranch(idx: number, substring: string, numBranches: number, numWraps: number) {
    let gen = stringHash(substring);
    function next() {
        return (gen = (gen * 4194303 + 127) % GEN_DIVISOR);
    }
    for (let i = 0; i < 5 + idx * numWraps; i++) {
        next();
    }
    const newVariation = () => {
        next();
        return objectValueByIndex(VARIATIONS, gen);
    };
    const random = () => {
        next();
        return gen / GEN_DIVISOR;
    };
    const affine = objectValueByIndex(AFFINES, gen);
    let variation = newVariation();

    if (random() < numWraps * 0.25) {
        variation = createInterpolatedVariation(
            variation,
            newVariation(),
            () => 0.5,
        );
    } else if (numWraps > 2 && random() < 0.2) {
        variation = createRouterVariation(
            variation,
            newVariation(),
            (p) => p.z < 0,
        );
    }
    const colorValues = [
        random() * 0.1 - 0.05,
        random() * 0.1 - 0.05,
        random() * 0.1 - 0.05,
    ];
    const focusIndex = idx % 3;
    colorValues[focusIndex] += 0.2;
    const color = new THREE.Color().fromArray(colorValues);
    color.multiplyScalar(numBranches / 3.5);
    const branch: Branch = {
        affine,
        color,
        variation,
    };
    return branch;
}

function objectValueByIndex<T>(obj: Record<string, T>, index: number) {
    const keys = Object.keys(obj);
    return obj[keys[index % keys.length]];
}

function stringHash(s: string) {
    let hash = 0, char;
    if (s.length === 0) { return hash; }
    for (let i = 0, l = s.length; i < l; i++) {
        char = s.charCodeAt(i);
        hash = hash * 31 + char;
        hash |= 0; // Convert to 32bit integer
    }
    hash *= hash * 31;
    return hash;
}

let renderer: THREE.WebGLRenderer;
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let geometry: THREE.Geometry;
const material: THREE.PointsMaterial = new THREE.PointsMaterial({
    vertexColors: THREE.VertexColors,
    size: 0.004,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
});
let pointCloud: THREE.Points;
const mousePressed = false;
const mousePosition = new THREE.Vector2(0, 0);
const lastMousePosition = new THREE.Vector2(0, 0);
let controls: THREE.OrbitControls;

let audioContext: SketchAudioContext;

let globalBranches: Branch[];
let superPoint: SuperPoint;

let cX = 0, cY = 0;
const jumpiness = 3;

const nameFromSearch = parse(location.search).name;

function init(_renderer: THREE.WebGLRenderer, _audioContext: SketchAudioContext) {
    audioContext = _audioContext;
    initAudio(_audioContext);
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0, 12, 50);

    renderer = _renderer;

    const aspectRatio = renderer.domElement.height / renderer.domElement.width;
    camera = new THREE.PerspectiveCamera(60, 1 / aspectRatio, 0.01, 1000);
    camera.position.z = 3;
    camera.position.y = 1;
    camera.lookAt(new THREE.Vector3());
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1;
    controls.maxDistance = 10;
    controls.minDistance = 0.1;
    controls.enableKeys = false;
    controls.enablePan = false;

    updateName(nameFromSearch);
}

let noiseGain: GainNode;
let oscLow: OscillatorNode;
let oscHigh: OscillatorNode;
let oscHighGain: GainNode;
let oscGain: GainNode;
let chord: any;
let filter: BiquadFilterNode;
let compressor: DynamicsCompressorNode;

function initAudio(context: SketchAudioContext) {
    context.gain.gain.value = 0;
    compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -40;
    compressor.knee.value = 35;
    compressor.attack.value = 0.1;
    compressor.release.value = 0.25;
    compressor.ratio.value = 1.8;

    // const noise = createPinkNoise(context);
    const noise = createWhiteNoise(context);
    noiseGain = context.createGain();
    noiseGain.gain.value = 0.0;
    noise.connect(noiseGain);
    noiseGain.connect(compressor);

    oscLow = context.createOscillator();
    oscLow.frequency.value = 0;
    oscLow.type = "square";
    oscLow.start(0);
    const oscLowGain = context.createGain();
    oscLowGain.gain.value = 0.6;
    oscLow.connect(oscLowGain);

    filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 100;
    filter.Q.value = 2.18;
    oscLowGain.connect(filter);

    oscHigh = context.createOscillator();
    oscHigh.frequency.value = 0;
    oscHigh.type = "triangle";
    oscHigh.start(0);
    oscHighGain = context.createGain();
    oscHighGain.gain.value = 0.05;
    oscHigh.connect(oscHighGain);

    oscGain = context.createGain();
    oscGain.gain.value = 0.0;
    filter.connect(oscGain);
    oscHighGain.connect(oscGain);
    oscGain.connect(compressor);

    // plays a major or minor chord
    chord = (() => {
        const root = context.createOscillator();
        root.type = "sine";
        root.start(0);

        const third = context.createOscillator();
        third.type = "sine";
        third.start(0);

        const fifth = context.createOscillator();
        fifth.type = "sine";
        fifth.start(0);
        const fifthGain = context.createGain();
        fifthGain.gain.value = 0.7;
        fifth.connect(fifthGain);

        const sub = context.createOscillator();
        sub.type = "triangle";
        sub.start(0);
        const subGain = context.createGain();
        subGain.gain.value = 0.9;
        sub.connect(subGain);

        const sub2 = context.createOscillator();
        sub2.type = "triangle";
        sub2.start(0);
        const sub2Gain = context.createGain();
        sub2Gain.gain.value = 0.8;
        sub2.connect(sub2Gain);

        const gain = context.createGain();
        gain.gain.value = 0;
        root.connect(gain);
        third.connect(gain);
        fifthGain.connect(gain);
        subGain.connect(gain);
        sub2Gain.connect(gain);

        // 0 = full major, 1 = full minor
        let minorBias = 0;
        let rootFreq = 0;
        let fifthBias = 0;

        function recompute() {
            root.frequency.value = rootFreq;
            const thirdScaleNote = 4 - minorBias;
            const thirdFreqScale = Math.pow(2, thirdScaleNote / 12);
            third.frequency.value = rootFreq * thirdFreqScale;
            const fifthScaleNote = 7 + fifthBias;
            const fifthFreqScale = Math.pow(2, fifthScaleNote / 12);
            fifth.frequency.value = rootFreq * fifthFreqScale;
            sub.frequency.value = rootFreq / 2;
            sub2.frequency.value = rootFreq / 4;
        }

        return {
            root,
            third,
            fifth,
            gain,
            setFrequency: (f: number) => {
                rootFreq = f;
                recompute();
            },
            setMinorBias: (mB: number) => {
                minorBias = mB;
                recompute();
            },
            setFifthBias: (fB: number) => {
                fifthBias = fB;
                recompute();
            },
        };
    })();
    chord.gain.connect(compressor);

    compressor.connect(context.gain);
}

class VelocityTrackerVisitor implements UpdateVisitor {
    public velocity = 0;
    public numVisited = 0;

    public visit(p: SuperPoint) {
        this.velocity += p.lastPoint.distanceTo(p.point);
        this.numVisited++;
    }

    public computeVelocity() {
        return this.velocity / this.numVisited;
    }
}

class LengthVarianceTrackerVisitor implements UpdateVisitor {
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
        // can go as high as 15 - 20, as low as 0.1
        return (varianceSumSq - (varianceSum * varianceSum) / varianceNumSamples) / (varianceNumSamples - 1);
    }
}

type BoxHash = { [boxCorner: string]: number };
class BoxCountVisitor implements UpdateVisitor {
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

let boundingSphere: THREE.Sphere | null;
function animate() {
    const time = performance.now() / 3000;
    cX = 2 * sigmoid(6 * Math.sin(time)) - 1;
    const velocityVisitor = new VelocityTrackerVisitor();
    const varianceVisitor = new LengthVarianceTrackerVisitor();
    const countVisitor = new BoxCountVisitor([1, 0.1, 0.01, 0.001]);
    superPoint.recalculate(jumpiness, computeDepth(), velocityVisitor, varianceVisitor, countVisitor);
    geometry.verticesNeedUpdate = true;
    if (boundingSphere == null) {
        geometry.computeBoundingSphere();
        boundingSphere = geometry.boundingSphere;
    }

    const velocity = velocityVisitor.computeVelocity();
    const variance = varianceVisitor.computeVariance();
    const [count, countDensity] = countVisitor.computeCountAndCountDensity();

    // density ranges from 1 to ~6 or 7 at the high end.
    // low density 1.5 and below are spaced out, larger fractals
    // between 1.5 and 3 is a nice variety
    // anything above 3 is really dense, hard to see
    const density = countDensity / count;

    const velocityFactor = Math.min(velocity * noiseGainScale, 0.3);
    const noiseAmplitude = 2 / (1 + density * density);
    const newNoiseGain = noiseGain.gain.value * 0.9 + 0.1 * velocityFactor * noiseAmplitude;
    noiseGain.gain.value = (newNoiseGain + 1e-4) * noiseGate;

    const newOscGain = oscGain.gain.value * 0.9 + 0.1 * Math.max(0, Math.min(velocity * velocity * 2000, 0.6) - 0.01);
    oscGain.gain.value = newOscGain;

    const newOscFreq = oscLow.frequency.value * 0.8 + 0.2 * (100 + baseLowFrequency * Math.pow(2, Math.log(1 + variance)));
    oscLow.frequency.value = newOscFreq * oscLowGate;

    const velocitySq = map(velocity * velocity, 1e-8, 0.005, -10, 10);
    oscHigh.frequency.value = Math.min(map(sigmoid(velocitySq), 0, 1, baseFrequency, baseFrequency * 5), 20000) * oscHighGate;

    chord.setFrequency(100 + 100 * boundingSphere.radius);
    chord.setMinorBias(baseThirdBias + velocity * 100 + sigmoid(variance - 3) * 4);
    chord.setFifthBias(baseFifthBias + countDensity / 3);
    chord.gain.gain.value = (chord.gain.gain.value * 0.9 + 0.1 * (velocityFactor * count * count / 8) + 3e-5) * chordGate;

    const cameraLength = camera.position.length();
    compressor.ratio.value = 1 + 3 / cameraLength;
    audioContext.gain.gain.value = audioContext.gain.gain.value * 0.95 + 0.05 * (2.5 / cameraLength);

    controls.update();
    // console.time("render");
    renderer.render(scene, camera);
    // console.timeEnd("render");
}

function sigmoid(x: number) {
    if (x > 10) {
        return 1;
    } else if (x < -10) {
        return 0;
    } else {
        return 1 / (1 + Math.exp(-x));
    }
}

function computeDepth() {
    // points at exactly depth d = b^d
    // points from depth 0...d = b^0 + b^1 + b^2 + ... b^d
    // we want total points to be ~120k, so
    // 120k = b^0 + b^1 + ... + b^d
    // only the last level really matters - the last level accounts for at least
    // half of the total sum (except for b = 1)
    const depth = (globalBranches.length === 1)
        ? 1000
        : Math.floor(Math.log(100000) / Math.log(globalBranches.length));
        // just do depth 1k to prevent call stack
    return depth;
}

function mousemove(event: JQuery.Event) {
    // cX = Math.pow(map(mouseX, 0, renderer.domElement.width, -1.5, 1.5), 3);
    // cY = Math.pow(map(mouseY, 0, renderer.domElement.height, 1.5, -1.5), 3);
    // cX = Math.pow(map(mouseX, 0, renderer.domElement.width, -0.5, 0.5), 1);
    // cY = Math.pow(map(mouseY, 0, renderer.domElement.height, 0.5, -0.5), 1);
}

function mousedown(event: JQuery.Event) {
}

function dblclick() {
    // jumpiness = 30;
}

let baseFrequency = 0;
let baseLowFrequency = 0;
let noiseGainScale = 0;
let baseThirdBias = 0;
let baseFifthBias = 0;
let noiseGate = 0;
let oscLowGate = 0;
let oscHighGate = 0;
let chordGate = 0;
function updateName(name: string = "Han") {
    const {origin, pathname} = window.location;
    const newUrl = `${origin}${pathname}?name=${name}`;
    window.history.replaceState({}, null!, newUrl);
    // jumpiness = 30;
    boundingSphere = null;
    audioContext.gain.gain.value = 0;
    const hash = stringHash(name);
    const hashNorm = (hash % 1024) / 1024;
    baseFrequency = map((hash % 2048) / 2048, 0, 1, 10, 6000);
    const hash2 = hash * hash + hash * 31 + 9;
    filter.frequency.value = map((hash2 % 2e12) / 2e12, 0, 1, 120, 400);
    const hash3 = hash2 * hash2 + hash2 * 31 + 9;
    filter.Q.value = map((hash3 % 2e12) / 2e12, 0, 1, 5, 8);
    baseLowFrequency = map((hash3 % 10) / 10, 0, 1, 10, 20);
    noiseGainScale = map((hash2 * hash3 % 100) / 100, 0, 1, 3, 6);
    baseThirdBias = (hash2 % 4) / 4;
    baseFifthBias = (hash3 % 3) / 3;

    // basically boolean randoms; we don't want mod 2 cuz the hashes are related to each other at that small level
    noiseGate = (hash3 % 100) < 50 ? 0 : 1;
    oscLowGate = (hash2 * hash3 % 96) < 48 ? 0 : 1;
    oscHighGate = (hash3 * hash3 % 4000) < 2000 ? 0 : 1;
    chordGate = (hash + hash2 + hash3) % 44 < 22 ? 0 : 1;

    cY = map(hashNorm, 0, 1, -2.5, 2.5);
    globalBranches = randomBranches(name);

    geometry = new THREE.Geometry();
    geometry.vertices = [];
    geometry.colors = [];
    superPoint = new SuperPoint(
        new THREE.Vector3(0, 0, 0),
        new THREE.Color(0, 0, 0),
        geometry,
        globalBranches,
    );

    scene.remove(pointCloud);

    pointCloud = new THREE.Points(geometry, material);
    pointCloud.rotateX(-Math.PI / 2);
    scene.add(pointCloud);
}

function resize() {
    camera.aspect = renderer.domElement.width / renderer.domElement.height;
    camera.updateProjectionMatrix();
}

class FlameNameInput extends React.Component<{}, {}> {
    public render() {
        return (
            <div className="flame-input">
                <input
                    defaultValue={nameFromSearch}
                    placeholder="Han"
                    maxLength={20}
                    onInput={this.handleInput}
                />
            </div>
        );
    }

    private handleInput = (event: React.FormEvent<HTMLInputElement>) => {
        const value = event.currentTarget.value;
        const name = (value == null || value === "") ? "Han" : value;
        updateName(name.trim());
    }
}

export const Flame: ISketch = {
    elements: [<FlameNameInput />],
    id: "flame",
    init,
    animate,
    dblclick,
    mousemove,
    mousedown,
    resize,
};
