import * as THREE from 'three';

import { map } from './math';
import { ISketch, SketchAudioContext } from './sketch';
import { MouseEvent } from 'react';

type Variation = (point: THREE.Vector3) => void;

interface Affine {
    color: THREE.Color;
    weight: number;
    transform: Variation;
    variation: Variation;
}

const VARIATIONS = {
    Linear: (point: THREE.Vector3) => {
        // no op
    },
    Sinusoidal: (point: THREE.Vector3) => {
        point.set(Math.sin(point.x), Math.sin(point.y), point.z);
    },
    Spherical: (point: THREE.Vector3) => {
        point.multiplyScalar(1 / point.lengthSq());
    },
    Polar: (point: THREE.Vector3) => {
        point.set(Math.atan2(point.y, point.x) / Math.PI, point.length() - 1, point.z);
    },
    Swirl: (point: THREE.Vector3) => {
        var r2 = point.lengthSq();
        point.set(point.x * Math.sin(r2) - point.y * Math.cos(r2),
                    point.x * Math.cos(r2) + point.y * Math.sin(r2),
                    point.z);
    },
};

function createInterpolatedVariation(variationA: Variation, variationB: Variation, interpolationFn: () => number) {
    return function(pointA: THREE.Vector3) {
        var pointB = pointA.clone();
        variationA(pointA);
        variationB(pointB);
        var interpolatedAmount = interpolationFn();
        pointA.lerp(pointB, interpolatedAmount);
    };
}

function stepAffine(affine: Affine, point: THREE.Vector3, color: THREE.Color) {
    // apply the affine transform to the point
    affine.transform(point);

    // apply the nonlinear variation to the point
    affine.variation(point);

    // interpolate towards the affine color
    // color.lerp(affine.color, 0.5);
    color.add(affine.color);
}

class AffineSet {
    public totalWeight: number;
    constructor (public affines: Affine[]) {
        this.totalWeight = this.affines.map(function (affine) { return affine.weight; }).reduce(function(x,y) { return x+y; });
    }

    public choose() {
        const weight = Math.random() * this.totalWeight;
        let chosenAffine = this.affines[0];
        this.affines.reduce(function (oldWeightSum, thisAffine) {
            if (oldWeightSum < weight && weight <= thisAffine.weight + oldWeightSum + 1e-10) {
                chosenAffine = thisAffine;
            };
            return thisAffine.weight + oldWeightSum;
        }, 0);
        return chosenAffine;
    }

    public step(point: THREE.Vector3, color: THREE.Color) {
        const affine = this.choose();
        stepAffine(affine, point, color);
    }
}

const CIRCLE_CLAWS = new AffineSet([
    {
        color: new THREE.Color(0.28, -0.12, -0.12),
        weight: 1,
        transform: function(point) {
            point.set((cX + point.x) / 2, (cY+point.y) / 2, point.z);
        },
        variation: VARIATIONS.Swirl
    },
    {
        color: new THREE.Color(0.07, 0.21, 0),
        weight: 1,
        transform: function(point) {
            point.set( (-1 + point.x) / 2 + 0.25, (-1 + point.y) / 2, point.z);
        },
        variation: VARIATIONS.Spherical
    },
    {
        color: new THREE.Color(0, 0.1, 0.35),
        weight: 1,
        transform: function(point) {
            point.set( (1 + point.x) / 2, (-1 + point.y) / 2, point.z);
        },
        variation: VARIATIONS.Polar
    },
]);

class SuperPoint {
    public children: SuperPoint[];
    constructor(
        public point: THREE.Vector3,
        public color: THREE.Color,
        public rootGeometry: THREE.Geometry) {
        this.point = point;
        this.color = color;
        this.rootGeometry = rootGeometry;
        rootGeometry.vertices.push(point);
        rootGeometry.colors.push(color);
    }

    public updateSubtree(affineSet: AffineSet, depth: number) {
        if (depth === 0) return;

        if (this.children === undefined) {
            this.children = affineSet.affines.map(() => {
                return new SuperPoint(new THREE.Vector3(), new THREE.Color(0, 0, 0), this.rootGeometry);
            });
        }

        this.children.forEach((child, idx) => {
            var affine = affineSet.affines[idx];
            // reset the child's position to your updated position so it's ready to get stepped
            child.point.copy(this.point);
            child.color.copy(this.color);
            stepAffine(affine, child.point, child.color);
            child.updateSubtree(affineSet, depth - 1);
        });
    }
}


let renderer: THREE.WebGLRenderer;
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let geometry: THREE.Geometry;
let material: THREE.PointCloudMaterial;
let pointCloud: THREE.PointCloud;
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

    geometry = new THREE.Geometry();

    superPoint = new SuperPoint(new THREE.Vector3(0, 0, 0), new THREE.Color(0, 0, 0), geometry);

    var material = new THREE.PointCloudMaterial({
        vertexColors: THREE.VertexColors,
        size: 0.01,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true
    });

    pointCloud = new THREE.PointCloud(geometry, material);
    pointCloud.rotateX(-Math.PI / 2);
    scene.add(pointCloud);

    const light = new THREE.SpotLight(0xffffff, 1);
    light.position.set(5, 20, 5);

    scene.add(light);

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200, 1, 1),
        new THREE.MeshLambertMaterial({
            color: 0xffffff,
            opacity: 0.5,
            transparent: true,
        }),
    );
    floor.rotateX(-Math.PI / 2);
    scene.add(floor);
}

function animate() {
    const x = performance.now() / 3000;
    superPoint.point.set(0,0,(Math.sin(x) + 1) / 25);
    superPoint.updateSubtree(CIRCLE_CLAWS, 10);
    geometry.verticesNeedUpdate = true;

    controls.update();
    renderer.render(scene, camera);
}

var cX = 0, cY = 0;
function mousemove(event: JQuery.Event) {
    var mouseX = event.offsetX == undefined ? (event.originalEvent as any).layerX : event.offsetX;
    var mouseY = event.offsetY == undefined ? (event.originalEvent as any).layerY : event.offsetY;

    cX = Math.pow(map(mouseX, 0, renderer.domElement.width, -1, 4), 3);
    cY = Math.pow(map(mouseY, 0, renderer.domElement.height, 4, -1), 3);
}

function mousedown(event: JQuery.Event) {
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
    resize: resize
};