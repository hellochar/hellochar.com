// import * as OrbitControls from "imports-loader?THREE=three!exports-loader?THREE.OrbitControls!three-examples/controls/OrbitControls";
import { parse } from "query-string";
import * as React from "react";
import * as THREE from "three";

import { createWhiteNoise } from "../../audio/noise";
import { AFFINES, BoxCountVisitor, Branch, createInterpolatedVariation, createRouterVariation, LengthVarianceTrackerVisitor, SuperPoint, VARIATIONS, VelocityTrackerVisitor } from "../../common/flame";
import { map } from "../../math";
import { ISketch, SketchAudioContext } from "../../sketch";
import { FlamePointsMaterial } from "./flamePointsMaterial";

const quality = screen.width > 480 ? "high" : "low";
let cDx = 0, cDy = 0;
// let drag = 1.0;
// let deltaDrag = 0;

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
    const affineBase = objectValueByIndex(AFFINES, gen);
    const affine = (point: THREE.Vector3) => {
        affineBase(point);
        point.x += cX / 5 + cDx;
        point.y += cY / 5 + cDy;

        // point.x *= drag;
        // point.y *= drag;
        // point.z *= drag;
    };
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

let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let geometry: THREE.Geometry;

const material = new FlamePointsMaterial();

let pointCloud: THREE.Points;
const mousePosition = new THREE.Vector2(0, 0);
let controls: THREE.OrbitControls;

let globalBranches: Branch[];
let superPoint: SuperPoint;

let cX = 0, cY = 0;
const jumpiness = 3;

const nameFromSearch = parse(location.search).name;

let noiseGain: GainNode;
let oscLow: OscillatorNode;
let oscHigh: OscillatorNode;
let oscHighGain: GainNode;
let oscGain: GainNode;
let chord: any;
let filter: BiquadFilterNode;
let compressor: DynamicsCompressorNode;

function initAudio(context: SketchAudioContext) {
    compressor = context.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-40, 0);
    compressor.knee.setValueAtTime(35, 0);
    compressor.attack.setValueAtTime(0.1, 0);
    compressor.release.setValueAtTime(0.25, 0);
    compressor.ratio.setValueAtTime(1.8, 0);

    // const noise = createPinkNoise(context);
    const noise = createWhiteNoise(context);
    noiseGain = context.createGain();
    noiseGain.gain.setValueAtTime(0, 0);
    noise.connect(noiseGain);
    noiseGain.connect(compressor);

    oscLow = context.createOscillator();
    oscLow.frequency.setValueAtTime(0, 0);
    oscLow.type = "square";
    oscLow.start(0);
    const oscLowGain = context.createGain();
    oscLowGain.gain.setValueAtTime(0.6, 0);
    oscLow.connect(oscLowGain);

    filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(100, 0);
    filter.Q.setValueAtTime(2.18, 0);
    oscLowGain.connect(filter);

    oscHigh = context.createOscillator();
    oscHigh.frequency.setValueAtTime(0, 0);
    oscHigh.type = "triangle";
    oscHigh.start(0);
    oscHighGain = context.createGain();
    oscHighGain.gain.setValueAtTime(0.05, 0);
    oscHigh.connect(oscHighGain);

    oscGain = context.createGain();
    oscGain.gain.setValueAtTime(0.0, 0);
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
        fifthGain.gain.setValueAtTime(0.7, 0);
        fifth.connect(fifthGain);

        const sub = context.createOscillator();
        sub.type = "triangle";
        sub.start(0);
        const subGain = context.createGain();
        subGain.gain.setValueAtTime(0.9, 0);
        sub.connect(subGain);

        const sub2 = context.createOscillator();
        sub2.type = "triangle";
        sub2.start(0);
        const sub2Gain = context.createGain();
        sub2Gain.gain.setValueAtTime(0.8, 0);
        sub2.connect(sub2Gain);

        const gain = context.createGain();
        gain.gain.setValueAtTime(0, 0);
        root.connect(gain);
        third.connect(gain);
        fifthGain.connect(gain);
        subGain.connect(gain);
        sub2Gain.connect(gain);

        // 0 = full major, 1 = full minor
        let minorBias = 0;
        const rootFreq = 120;
        let fifthBias = 0;
        let baseScaleDegree = 0;
        let isMajor = true;

        const MAJOR_SCALE = [
            0,
            2,
            4,
            5,
            7,
            9,
            11,
        ];

        const MINOR_SCALE = [
            0,
            2,
            3,
            5,
            7,
            8,
            10,
        ];

        function getSemitoneNumber(scaleIndex: number) {
            const scale = isMajor ? MAJOR_SCALE : MINOR_SCALE;
            const octave = Math.floor(scaleIndex / scale.length);
            const pitchClass = scaleIndex % scale.length;
            const semitoneNumber = octave * 12 + scale[pitchClass];
            return semitoneNumber;
        }

        function getFreq(semitoneNumber: number) {
            return rootFreq * Math.pow(2, semitoneNumber / 12);
        }

        function recompute() {
            const rootSemitone = getSemitoneNumber(baseScaleDegree + 0);
            root.frequency.setValueAtTime(getFreq(rootSemitone), 0);

            const thirdSemitone = getSemitoneNumber(baseScaleDegree + 3) - minorBias;
            third.frequency.setValueAtTime(getFreq(thirdSemitone), 0);

            const fifthSemitone = getSemitoneNumber(baseScaleDegree + 5) + fifthBias;
            fifth.frequency.setValueAtTime(getFreq(fifthSemitone), 0);

            sub.frequency.setValueAtTime(getFreq(rootSemitone) / 2, 0);
            sub2.frequency.setValueAtTime(getFreq(rootSemitone) / 4, 0);
        }

        return {
            root,
            third,
            fifth,
            gain,
            setIsMajor: (major: boolean) => {
                isMajor = major;
                recompute();
            },
            setScaleDegree: (sd: number) => {
                baseScaleDegree = Math.round(sd);
                recompute();
            },
            setMinorBias: (mB: number) => {
                minorBias = Math.round(mB);
                recompute();
            },
            setFifthBias: (fB: number) => {
                fifthBias = Math.round(fB);
                recompute();
            },
        };
    })();
    chord.gain.connect(compressor);

    compressor.connect(context.gain);
}

// let boundingSphere: THREE.Sphere | null;

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
    const mouseX = event.offsetX == null ? (event.originalEvent as MouseEvent).layerX : event.offsetX;
    const mouseY = event.offsetY == null ? (event.originalEvent as MouseEvent).layerY : event.offsetY;

    mousePosition.x = mouseX;
    mousePosition.y = mouseY;
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
let audioHasNoise = false;
let audioHasChord = false;
let oscLowGate = 0;
let oscHighGate = 0;

class FlameNameInput extends React.Component<{ onInput: (newName: string) => void }, {}> {
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
        const name = (value == null || value === "") ? "Han" : value.trim();
        this.props.onInput(name);
    }
}

export class FlameSketch extends ISketch {
    public elements = [<FlameNameInput key="input" onInput={(name) => this.updateName(name)} />];
    public id = "flame";
    public events = {
        dblclick,
        mousemove,
        mousedown,
    };

    public init() {
        initAudio(this.audioContext);
        const bgColor = new THREE.Color("#10101f")
        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(bgColor.getHex(), 2, 60);
        scene.background = bgColor;

        camera = new THREE.PerspectiveCamera(60, 1 / this.aspectRatio, 0.01, 25);
        camera.position.z = 2;
        camera.position.y = 1;
        camera.lookAt(new THREE.Vector3());
        controls = new THREE.OrbitControls(camera, this.renderer.domElement);
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1;
        controls.maxDistance = 8;
        controls.minDistance = 0.1;
        controls.enableKeys = false;
        controls.enablePan = false;

        this.updateName(nameFromSearch);
    }

    public animate() {
        if (quality === "high") {
            this.animateSuperPoint();
        }

        const cameraLength = camera.position.length();
        compressor.ratio.setTargetAtTime(1 + 0.5 / (1. + cameraLength), this.audioContext.currentTime, 0.016);
        this.audioContext.gain.gain.setTargetAtTime((1.0 / (1. + cameraLength)) + 0.5, this.audioContext.currentTime, 0.016);

        material.setFocalLength( cameraLength );

        cDx = THREE.Math.mapLinear(mousePosition.x, 0, this.canvas.width, -1, 1);
        cDy = THREE.Math.mapLinear(mousePosition.y, 0, this.canvas.width, -1, 1);

        controls.update();
        // console.time("render");
        this.renderer.render(scene, camera);
        // console.timeEnd("render");
    }

    public animateSuperPoint() {
        const time = performance.now() / 3000;
        cX = 2 * sigmoid(6 * Math.sin(time)) - 1;
        const velocityVisitor = new VelocityTrackerVisitor();
        const varianceVisitor = new LengthVarianceTrackerVisitor();
        const countVisitor = new BoxCountVisitor([1, 0.1, 0.01, 0.001]);
        superPoint.recalculate(jumpiness, jumpiness, jumpiness, computeDepth(), true, velocityVisitor, varianceVisitor, countVisitor);

        // for ( let i = 0; i < 1; i++) {
        //     this.stepDrag(1);
        // }

        // if (boundingSphere == null) {
        //     geometry.computeBoundingSphere();
        //     boundingSphere = geometry.boundingSphere;
        // }
        this.updateAudio(velocityVisitor, varianceVisitor, countVisitor);
    }

    public updateAudio(
        velocityVisitor: VelocityTrackerVisitor,
        varianceVisitor: LengthVarianceTrackerVisitor,
        countVisitor: BoxCountVisitor,
    ) {
        const velocity = velocityVisitor.computeVelocity();
        const variance = varianceVisitor.computeVariance();
        const [count, countDensity] = countVisitor.computeCountAndCountDensity();

        // density ranges from 1 to ~6 or 7 at the high end.
        // low density 1.5 and below are spaced out, larger fractals
        // between 1.5 and 3 is a nice variety
        // anything above 3 is really dense, hard to see
        const density = countDensity / count;

        const velocityFactor = Math.min(velocity * noiseGainScale, 0.06);
        if (audioHasNoise) {
            const noiseAmplitude = 2 / (1 + density * density);
            // smooth out density random noise
            const target = noiseGain.gain.value * 0.5 + 0.5 * (velocityFactor * noiseAmplitude + 1e-5);
            noiseGain.gain.setTargetAtTime(target, noiseGain.context.currentTime, 0.016);
        }

        const newOscGain = oscGain.gain.value * 0.9 + 0.1 * Math.max(0, Math.min(velocity * velocity * 2000, 0.6) - 0.01);
        oscGain.gain.setTargetAtTime(newOscGain, oscGain.context.currentTime, 0.016);

        // const newOscFreq = oscLow.frequency.value * 0.8 + 0.2 * (100 + baseLowFrequency * Math.pow(2, Math.log(1 + variance)));
        // oscLow.frequency.setTargetAtTime(newOscFreq * oscLowGate, oscLow.context.currentTime, 0.016);

        // const velocitySq = map(velocity * velocity, 1e-8, 0.005, -10, 10);
        // oscHigh.frequency.setTargetAtTime(
        //     Math.min(map(sigmoid(velocitySq), 0, 1, baseFrequency, baseFrequency * 5), 20000) * oscHighGate,
        //     oscHigh.context.currentTime,
        //     0.016,
        // );

        if (audioHasChord) {
            const baseOffset = THREE.Math.clamp(Math.floor(map(density, 1.0, 3, 0, 24)), 0, 48);
            chord.setScaleDegree(baseOffset);
            // chord.setMinorBias(velocity * 2 + sigmoid(variance - 3) * 4);
            // chord.setFifthBias(countDensity / 5);
            // console.log(velocity, variance, countDensity, "third:", velocity * 2 + sigmoid(variance - 3) * 4, "fifth", countDensity / 5);
            const target = (chord.gain.gain.value * 0.9 + 0.1 * (velocityFactor * count * count / 8 + 0.0001));
            chord.gain.gain.setTargetAtTime(target, chord.gain.context.currentTime, 0.016);
        } else {
            chord.gain.gain.setTargetAtTime(0, chord.gain.context.currentTime, 0.016);
        }
    }

    public resize() {
        camera.aspect = 1 / this.aspectRatio;
        camera.updateProjectionMatrix();
    }

    public updateName(name: string = "Han") {
        this.audioContext.gain.gain.setValueAtTime(0, 0);
        const { origin, pathname } = window.location;
        const newUrl = `${origin}${pathname}?name=${name}`;
        window.history.replaceState({}, null!, newUrl);
        // jumpiness = 30;
        // boundingSphere = null;
        const hash = stringHash(name);
        const hashNorm = (hash % 1024) / 1024;
        baseFrequency = map((hash % 2048) / 2048, 0, 1, 10, 6000);
        const hash2 = hash * hash + hash * 31 + 9;
        filter.frequency.setValueAtTime(map((hash2 % 2e12) / 2e12, 0, 1, 120, 400), 0);
        const hash3 = hash2 * hash2 + hash2 * 31 + 9;
        filter.Q.setValueAtTime(map((hash3 % 2e12) / 2e12, 0, 1, 5, 8), 0);
        baseLowFrequency = map((hash3 % 10) / 10, 0, 1, 10, 20);
        noiseGainScale = map((hash2 * hash3 % 100) / 100, 0, 1, 0.5, 1);
        baseThirdBias = (hash2 % 4) / 4;
        baseFifthBias = (hash3 % 3) / 3;
        chord.setIsMajor = hash2 % 2 === 0;

        // basically boolean randoms; we don't want mod 2 cuz the hashes are related to each other at that small level
        audioHasNoise = (hash3 % 100) >= 50;
        oscLowGate = (hash2 * hash3 % 96) < 48 ? 0 : 1;
        oscHighGate = (hash3 * hash3 % 4000) < 2000 ? 0 : 1;
        audioHasChord = true;

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

        if (quality === "low") {
            superPoint.recalculate(jumpiness, jumpiness, jumpiness, computeDepth(), false);
        }
    }
}
