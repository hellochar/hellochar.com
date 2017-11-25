// import * as OrbitControls from "imports-loader?THREE=three!exports-loader?THREE.OrbitControls!three-examples/controls/OrbitControls";
import { parse } from "query-string";
import { KeyboardEvent, MouseEvent } from "react";
import * as React from "react";
import * as THREE from "three";

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

// const CIRCLE_CLAWS: Branch[] = [
//     {
//         color: new THREE.Color(0.28, -0.12, -0.12),
//         affine: AFFINES.TowardsOriginNegativeBias,
//         variation: VARIATIONS.Swirl
//     },
//     {
//         color: new THREE.Color(0.07, 0.21, 0),
//         affine: AFFINES.TowardsOriginNegativeBias,
//         variation: VARIATIONS.Spherical
//     },
//     {
//         color: new THREE.Color(0, 0.1, 0.35),
//         affine: AFFINES.TowardsOrigin2,
//         variation: VARIATIONS.Polar
//     },
// ];

class SuperPoint {
    public children: SuperPoint[];
    constructor(
        public point: THREE.Vector3,
        public color: THREE.Color,
        public rootGeometry: THREE.Geometry,
        private branches: Branch[],
    ) {
        rootGeometry.vertices.push(point);
        rootGeometry.colors.push(color);
    }

    public updateSubtree(depth: number) {
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
            child.point.copy(this.point);
            child.color.copy(this.color);
            applyBranch(branch, child.point, child.color);
            child.updateSubtree(depth - 1);
        });
    }

    public recalculate() {
        this.point.set(jumpiness, jumpiness, jumpiness);
        // this.point.set(0,0,0);
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
        // console.log(branches);
        this.updateSubtree(depth);
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
function randomBranch(idx: number, substring: string, numBranches: number, numWraps: number) {
    let charCode = stringHash(substring);
    function gen() {
        return (charCode = (charCode * 4910711 + 39) % 2e16);
    }
    for (let i = 0; i < 5; i++) {
        gen();
    }
    const newVariation = () => {
        gen();
        return objectValueByIndex(VARIATIONS, charCode);
    };
    const random = () => {
        gen();
        return charCode / 2e16;
    };
    const affine = objectValueByIndex(AFFINES, charCode);
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

// function randomValue<T>(obj: Record<string, T>) {
//     const keys = Object.keys(obj);
//     const index = Math.floor(Math.random() * keys.length);
//     return obj[keys[index]];
// }

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

let globalBranches: Branch[];
let superPoint: SuperPoint;

let cX = 0, cY = 0;
let jumpiness = 0;

const nameFromSearch = parse(location.search).name;

function init(_renderer: THREE.WebGLRenderer, _audioContext: SketchAudioContext) {
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

function animate() {
    const time = performance.now() / 3000;
    cX = 2 / (1 + Math.exp(-6 * Math.sin(time))) - 1;
    jumpiness *= 0.9;
    superPoint.recalculate();
    geometry.verticesNeedUpdate = true;

    controls.update();
    renderer.render(scene, camera);
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
    jumpiness = 30;
}

function updateName(name: string = "Han") {
    const {origin, pathname} = window.location;
    const newUrl = `${origin}${pathname}?name=${name}`;
    window.history.replaceState({}, null!, newUrl);
    jumpiness = 30;
    const hash = stringHash(name);
    const hashNorm = (hash % 1024) / 1024;
    cY = hashNorm * 5 - 2.5;
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
