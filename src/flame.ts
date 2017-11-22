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
        point.set(Math.sin(point.x), Math.sin(point.y), 0);
    },
    Spherical: (point: THREE.Vector3) => {
        point.multiplyScalar(1 / point.lengthSq());
    },
    Polar: (point: THREE.Vector3) => {
        point.set(Math.atan2(point.y, point.x) / Math.PI, point.length() - 1, 0);
    },
    Swirl: (point: THREE.Vector3) => {
        var r2 = point.lengthSq();
        point.set(point.x * Math.sin(r2) - point.y * Math.cos(r2),
                    point.x * Math.cos(r2) + point.y * Math.sin(r2),
                    0);
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

var SERPINSKI_TRIANGLE = new AffineSet([
    {
        color: new THREE.Color(0xff8888),
        weight: 1,
        transform: function(point) {
            point.set((cX + point.x) / 2, (cY+point.y) / 2, 0);
        },
        variation: VARIATIONS.Swirl
    },
    {
        color: new THREE.Color("green"),
        weight: 1,
        transform: function(point) {
            point.set( (-1 + point.x) / 2 + 0.25, (-1 + point.y) / 2, 0);
        },
        variation: VARIATIONS.Spherical
    },
    {
        color: new THREE.Color("blue"),
        weight: 1,
        transform: function(point) {
            point.set( (1 + point.x) / 2, (-1 + point.y) / 2, 0);
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
                return new SuperPoint(new THREE.Vector3(), new THREE.Color(), this.rootGeometry);
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

let superPoint: SuperPoint;

function init(_renderer: THREE.WebGLRenderer, _audioContext: SketchAudioContext) {
    scene = new THREE.Scene();

    renderer = _renderer;

    var aspectRatio = renderer.domElement.height / renderer.domElement.width;
    // camera = new THREE.OrthographicCamera(-1.1, 1.1, -1.1*aspectRatio, 1.1*aspectRatio, 1, 1000);
    camera = new THREE.PerspectiveCamera(60, 1 / aspectRatio, 1, 1000);
    camera.position.z = 3;
    camera.position.y = -2;
    camera.position.x = -1;
    camera.lookAt(new THREE.Vector3());

    geometry = new THREE.Geometry();

    superPoint = new SuperPoint(new THREE.Vector3(0, 0, 0), new THREE.Color(), geometry);

    var material = new THREE.PointCloudMaterial({
        vertexColors: THREE.VertexColors,
        size: 0.01,
        sizeAttenuation: true
    });

    pointCloud = new THREE.PointCloud(geometry, material);
    scene.add(pointCloud);
}

function animate() {
    camera.rotateZ(0.001);
    // superPoint.point.set(cX, cY, 0);
    const x = performance.now() / 10000;
    superPoint.point.set(x,0,0);
    // superPoint.updateSubtree(SERPINSKI_TRIANGLE, 9);
    superPoint.updateSubtree(SERPINSKI_TRIANGLE, 10);
    // geometry.vertices.forEach(function (point, idx) {
    //     var color = geometry.colors[idx];
    //     color.setRGB(0,0,0);
    //     SERPINSKI_TRIANGLE.step(point, color);
    // });
    geometry.verticesNeedUpdate = true;
    renderer.render(scene, camera);
}

var cX = 0, cY = 0;
function mousemove(event: JQuery.Event) {
    var mouseX = event.offsetX == undefined ? (event.originalEvent as any).layerX : event.offsetX;
    var mouseY = event.offsetY == undefined ? (event.originalEvent as any).layerY : event.offsetY;

    cX = Math.pow(map(mouseX, 0, renderer.domElement.width, -4, 4), 3);
    cY = Math.pow(map(mouseY, 0, renderer.domElement.height, 4, -4), 3);
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