import * as THREE from 'three';

import { map } from './math';
import { ISketch, SketchAudioContext } from './sketch';
import { MouseEvent, KeyboardEvent } from 'react';

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
        point.set( (point.x + 1) / 2, (point.y - 1) / 2, (point.z + 1) / 2);
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
            (-point.z + point.x + point.y) / 2.1
        );
    },
    Up1: (point: THREE.Vector3) => {
        point.set(point.x, point.y, point.z + 1);
    }
}

const VARIATIONS = {
    Linear: (point: THREE.Vector3) => {
        // no op
    },
    Sin: (point: THREE.Vector3) => {
        point.set(Math.sin(point.x), Math.sin(point.y), Math.sin(point.z));
    },
    Spherical: (point: THREE.Vector3) => {
        point.multiplyScalar(1 / point.lengthSq());
    },
    Polar: (point: THREE.Vector3) => {
        point.set(Math.atan2(point.y, point.x) / Math.PI, point.length() - 1, Math.atan2(point.z, point.x));
    },
    Swirl: (point: THREE.Vector3) => {
        var r2 = point.lengthSq();
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
    }
};

function createInterpolatedVariation(variationA: Transform, variationB: Transform, interpolationFn: () => number) {
    return function(pointA: THREE.Vector3) {
        var pointB = pointA.clone();
        variationA(pointA);
        variationB(pointB);
        var interpolatedAmount = interpolationFn();
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
    }
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

const CIRCLE_CLAWS: Branch[] = [
    {
        color: new THREE.Color(0.28, -0.12, -0.12),
        affine: AFFINES.TowardsOriginNegativeBias,
        variation: VARIATIONS.Swirl
    },
    {
        color: new THREE.Color(0.07, 0.21, 0),
        affine: AFFINES.TowardsOriginNegativeBias,
        variation: VARIATIONS.Spherical
    },
    {
        color: new THREE.Color(0, 0.1, 0.35),
        affine: AFFINES.TowardsOrigin2,
        variation: VARIATIONS.Polar
    },
];

let branches: Branch[] = CIRCLE_CLAWS;

class SuperPoint {
    public children: SuperPoint[];
    constructor(
        public point: THREE.Vector3,
        public color: THREE.Color,
        public rootGeometry: THREE.Geometry,
        private branches: Branch[]
    ) {
        rootGeometry.vertices.push(point);
        rootGeometry.colors.push(color);
    }

    public updateSubtree(depth: number) {
        if (depth === 0) return;

        if (this.children === undefined) {
            this.children = branches.map(() => {
                return new SuperPoint(
                    new THREE.Vector3(),
                    new THREE.Color(0, 0, 0),
                    this.rootGeometry,
                    this.branches,
                );
            });
        }

        this.children.forEach((child, idx) => {
            const branch = branches[idx];
            // reset the child's position to your updated position so it's ready to get stepped
            child.point.copy(this.point);
            child.color.copy(this.color);
            applyBranch(branch, child.point, child.color);
            child.updateSubtree(depth - 1);
        });
    }

    public recalculate() {
        const t = performance.now() / 10000;
        const z = 1 / (1 + Math.exp(-10 * Math.sin(t)));;
        this.point.set(0, 0, z / 100);
        // this.point.set(0,0,0);
        // we can support around 100k points. numPoints = branchLength ^ depth
        // log(numPoints) = depth * log(branchLength)
        // log(numPoints) / log(branchLength) = depth
        const depth = Math.floor(Math.log(120000) / Math.log(branches.length));
        // console.log(branches);
        this.updateSubtree(depth);
    }
}

function randomBranches() {
    const numAffines = Math.floor(map(Math.random(), 0, 1, 2, 7));
    const branches: Branch[] = [];
    for (let i = 0; i < numAffines; i++) {
        branches.push(randomBranch(i));
    }
    return branches;
}

function randomBranch(idx: number) {
    const affine = randomValue(AFFINES);
    let variation = randomValue(VARIATIONS);

    if (Math.random() < 0.2) {
        variation = createInterpolatedVariation(
            randomValue(VARIATIONS),
            randomValue(VARIATIONS),
            () => 0.5
        );
    } else if (Math.random() < 0.2) {
        variation = createRouterVariation(
            randomValue(VARIATIONS),
            randomValue(VARIATIONS),
            (p) => p.z < 0
        );
    }
    const colorValues = [
        Math.random() * 0.1 - 0.05,
        Math.random() * 0.1 - 0.05,
        Math.random() * 0.1 - 0.05
    ];
    const focusIndex = idx % 3;
    colorValues[focusIndex] += 0.2;
    const color = new THREE.Color().fromArray(colorValues);
    console.log(color);
    const branch: Branch = {
        affine,
        color,
        variation,
    }
    return branch;
}

function randomValue<T>(obj: Record<string, T>) {
    const keys = Object.keys(obj);
    const index = Math.floor(Math.random() * keys.length);
    return obj[keys[index]];
}

let renderer: THREE.WebGLRenderer;
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let geometry: THREE.Geometry;
let material: THREE.PointsMaterial;
let pointCloud: THREE.Points;
let raycaster: THREE.Raycaster;
let mousePressed = false;
let mousePosition = new THREE.Vector2(0, 0);
let lastMousePosition = new THREE.Vector2(0, 0);
let controls: THREE.OrbitControls;

let superPoint: SuperPoint;

function init(_renderer: THREE.WebGLRenderer, _audioContext: SketchAudioContext) {
    scene = new THREE.Scene();

    renderer = _renderer;

    var aspectRatio = renderer.domElement.height / renderer.domElement.width;
    // camera = new THREE.OrthographicCamera(-1.1, 1.1, -1.1*aspectRatio, 1.1*aspectRatio, 1, 1000);
    camera = new THREE.PerspectiveCamera(60, 1 / aspectRatio, 0.01, 1000);
    camera.position.z = 3;
    camera.position.y = 1;
    camera.lookAt(new THREE.Vector3());
    controls = new THREE.OrbitControls(camera);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    geometry = new THREE.Geometry();

    superPoint = new SuperPoint(
        new THREE.Vector3(0, 0, 0),
        new THREE.Color(0, 0, 0),
        geometry,
        branches,
    );

    material = new THREE.PointsMaterial({
        vertexColors: THREE.VertexColors,
        size: 0.003,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true
    });

    pointCloud = new THREE.Points(geometry, material);
    pointCloud.rotateX(-Math.PI / 2);
    scene.add(pointCloud);

    // const plane = new THREE.Mesh(
    //     // new THREE.PlaneGeometry(200, 200, 1, 1),
    //     new THREE.BoxGeometry(5, 5, 0.05),
    //     new THREE.MeshBasicMaterial({
    //         color: 0xffffff,
    //         opacity: 0.5,
    //         transparent: true
    //     })
    // );
    // plane.rotateX(-Math.PI / 2);
    // plane.translateZ(-1);
    // scene.add(plane);

    // scene.add(new THREE.AxisHelper(1));
}

function animate() {
    superPoint.recalculate();
    geometry.verticesNeedUpdate = true;

    controls.update();
    renderer.render(scene, camera);
}

var cX = 0, cY = 0;
function mousemove(event: JQuery.Event) {
    var mouseX = event.offsetX == undefined ? (event.originalEvent as any).layerX : event.offsetX;
    var mouseY = event.offsetY == undefined ? (event.originalEvent as any).layerY : event.offsetY;

    cX = Math.pow(map(mouseX, 0, renderer.domElement.width, -1.5, 1.5), 3);
    cY = Math.pow(map(mouseY, 0, renderer.domElement.height, 1.5, -1.5), 3);
    // cX = Math.pow(map(mouseX, 0, renderer.domElement.width, -0.5, 0.5), 1);
    // cY = Math.pow(map(mouseY, 0, renderer.domElement.height, 0.5, -0.5), 1);
}

function mousedown(event: JQuery.Event) {
}

function keypress(event: JQuery.Event) {
    if ((event.originalEvent as any).code === "Space") {
        branches = randomBranches();

        geometry = new THREE.Geometry();
        geometry.vertices = [];
        geometry.colors = [];
        superPoint = new SuperPoint(
            new THREE.Vector3(0, 0, 0),
            new THREE.Color(0, 0, 0),
            geometry,
            branches,
        );

        scene.remove(pointCloud);

        pointCloud = new THREE.Points(geometry, material);
        pointCloud.rotateX(-Math.PI / 2);
        scene.add(pointCloud);
    }
}

function resize() {
    camera.aspect = renderer.domElement.width / renderer.domElement.height;
    camera.updateProjectionMatrix();
}

export const Flame: ISketch = {
    id: "flame",
    init: init,
    animate: animate,
    mousemove: mousemove,
    mousedown: mousedown,
    keypress: keypress,
    resize: resize
};