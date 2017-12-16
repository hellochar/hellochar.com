import * as React from "react";
import * as THREE from "three";

import { ExplodeShader } from "../common/explodeShader";
import { ISketch, SketchAudioContext } from "../sketch";
// import Worker from 'worker-loader!./worker';

// const worker = new Worker();

// worker.postMessage({ a: 1 });
// worker.onmessage = (event) => {};

// worker.addEventListener("message", (event) => {});

const cameraLeft = -0.8888888888888888;
const cameraRight = 0.8888888888888888;
const cameraTop = 0.5;
const cameraBottom = -0.5;
const FGMASK_WIDTH = 200;
const FGMASK_HEIGHT = 150;

const PX_FACTOR = FGMASK_WIDTH / (cameraRight - cameraLeft);
const PY_FACTOR = FGMASK_HEIGHT / (cameraBottom - cameraTop);

let now: number = 0;
class Particle {
    public velocity = new THREE.Vector3();

    public constructor(public position: THREE.Vector3, public color: THREE.Color) {
        this.randomizeVelocity();
    }

    public animate(camera: THREE.OrthographicCamera, fgmaskData: Uint8Array, fgmaskWidth: number, fgmaskHeight: number) {
        const pixelX = Math.floor(THREE.Math.mapLinear(this.position.x, camera.left, camera.right, 0, fgmaskWidth));
        const pixelY = Math.floor(THREE.Math.mapLinear(this.position.y, camera.top, camera.bottom, 0, fgmaskHeight));
        const pixelIndex = pixelY * fgmaskWidth + pixelX;
        const pixelValue = fgmaskData[pixelIndex];

        this.velocity.x += this.position.x * 0.001;
        this.velocity.y += this.position.y * 0.001;
        this.velocity.y -= Math.sin(now / 10000) * 0.001;

        const movementScalar = pixelValue / 127 + 0.1;
        this.color.setRGB(0.4, movementScalar / 1.5 + 0.4, 0.5 + movementScalar / 1.3);
        this.position.set(
            this.position.x + this.velocity.x * movementScalar,
            this.position.y + this.velocity.y * movementScalar,
            0,
        );
        if (this.position.x > camera.right ||
            this.position.x < camera.left ||
            this.position.y > camera.top ||
            this.position.y < camera.bottom
        ) {
            this.randomizeVelocity();
            this.position.set(
                0, 0,
                // THREE.Math.randFloat(camera.left, camera.right),
                // THREE.Math.randFloat(camera.bottom, camera.top),
                0,
            );
        }
    }

    public randomizeVelocity() {
        const angle = Math.random() * Math.PI * 2;
        const frequency = THREE.Math.mapLinear(Math.cos(now / 30000), -1, 1, 10000, 30000);
        let velocitySpread = (Math.sin(now / frequency) + 1) / 2;
        velocitySpread *= velocitySpread;
        velocitySpread *= velocitySpread;
        velocitySpread = 1 - velocitySpread;
        const velocity = 0.1 * velocitySpread + Math.random() * 0.1 * (1 - velocitySpread);
        this.velocity.set(Math.cos(angle) * velocity, Math.sin(angle) * velocity, 0);
    }
}

class Line {
    public geometry = new THREE.Geometry();
    public static material = new THREE.LineBasicMaterial({
        color: new THREE.Color("rgb(50, 12, 12)"),
        transparent: true,
        opacity: .03,
    });
    public lineObject: THREE.Line;

    constructor(public offset: number) {
        this.geometry.vertices.push(...(new Array(100).fill(null).map((() => new THREE.Vector3()))));
        this.lineObject = new THREE.Line(this.geometry, Line.material);
    }

    public animate(camera: THREE.OrthographicCamera, fgmaskData: Uint8Array, fgmaskWidth: number, fgmaskHeight: number) {
        const LOOP_TIME = 20000;
        this.geometry.vertices.forEach((vertex, index) => {
            const x = THREE.Math.mapLinear((performance.now() + this.offset * LOOP_TIME) % LOOP_TIME, 0, LOOP_TIME, camera.left, camera.right);
            const y = THREE.Math.mapLinear(index, 0, 100, camera.top, camera.bottom);

            // now grab the pixel from the background subtraction. We don't need to modify aspect ratios here since
            // we've carefully arranged everything to be 16:9

            const pixelX = Math.floor(THREE.Math.mapLinear(x, camera.left, camera.right, 0, fgmaskWidth));
            const pixelY = Math.floor(THREE.Math.mapLinear(y, camera.top, camera.bottom, 0, fgmaskHeight));
            const pixelIndex = pixelY * fgmaskWidth + pixelX;
            const pixelValue = fgmaskData[pixelIndex];

            const offsetX = THREE.Math.mapLinear(pixelValue, 0, 255, 0, 0.1);
            const offsetY = THREE.Math.mapLinear(pixelValue, 0, 255, 0, 0.1);
            vertex.set(x + offsetX, y + offsetY, 0);
        });
        this.geometry.verticesNeedUpdate = true;
        this.geometry.colorsNeedUpdate = true;
    }
}

export const Slow = new (class implements ISketch {
    public id = "slow";

    public lines: Line[];
    public scene = new THREE.Scene();
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.OrthographicCamera;
    public particles: Particle[];

    public composer: THREE.EffectComposer;
    public filter: THREE.ShaderPass;

    public audioContext: SketchAudioContext;

    public init(renderer: THREE.WebGLRenderer, audioContext: SketchAudioContext) {
        this.renderer = renderer;
        this.audioContext = audioContext;
        this.initVideo();
        this.setupCamera();
        // this.setupLines();
        this.setupParticles();
        this.composer = new THREE.EffectComposer(renderer);
        this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
        const filter = this.filter = new THREE.ShaderPass(ExplodeShader);
        filter.uniforms.iResolution.value = new THREE.Vector2(renderer.domElement.width, renderer.domElement.height);
        filter.renderToScreen = true;
        this.composer.addPass(filter);
    }

    public particleGeometry = new THREE.Geometry();
    public particlePoints: THREE.Points;
    public setupParticles() {
        this.particles = new Array(1000000).fill(null).map(() => {
            const position = new THREE.Vector3();
            const color = new THREE.Color(1, 1, 1);
            this.particleGeometry.vertices.push(position);
            this.particleGeometry.colors.push(color);
            return new Particle(position, color);
        });
        this.particleGeometry.colorsNeedUpdate = true;
        this.particlePoints = new THREE.Points(
            this.particleGeometry,
            new THREE.PointsMaterial({
                vertexColors: THREE.VertexColors,
                transparent: true,
                opacity: 0.2,
                size: 1,
            }),
        );
        this.scene.add(this.particlePoints);
    }

    public setupCamera() {
        this.camera = new THREE.OrthographicCamera(0, 1, 0, 1, 1, 1000);
        this.camera.position.z = 500;
        this.camera.lookAt(new THREE.Vector3());
        this.resize(this.renderer.domElement.width, this.renderer.domElement.height);
    }

    public resize(elementWidth: number, elementHeight: number) {
        let width = 1, height = 1;
        if (elementWidth > elementHeight) {
            height = 1;
            width = 1 * elementWidth / elementHeight;
        } else {
            width = 1;
            height = 1 * elementHeight / elementWidth;
        }
        this.camera.left = -width / 2;
        this.camera.top = height / 2;
        this.camera.bottom = -height / 2;
        this.camera.right = width / 2;
        this.camera.updateProjectionMatrix();
    }

    get aspectRatio() {
        return this.renderer.domElement.height / this.renderer.domElement.width;
    }

    private cap: cv.VideoCapture;
    private frame: cv.Mat;
    private fgmask: cv.Mat;
    private fgbg: cv.BackgroundSubtractorMOG2;

    public initVideo() {
        const constraints: MediaStreamConstraints = {
            // video: {
            //     aspectRatio: 16 / 9,
            // },
            video: true,
        };

        navigator.getUserMedia(
            constraints,
            (localMediaStream) => {
                const video = document.getElementsByTagName("video")[0];
                video.src = window.URL.createObjectURL(localMediaStream);

                this.cap = new cv.VideoCapture(video);

                this.frame = new cv.Mat(video.height, video.width, cv.CV_8UC4);
                this.fgmask = new cv.Mat(video.height, video.width, cv.CV_8UC1);
                this.fgbg = new cv.BackgroundSubtractorMOG2(60 * 10, 40, false);
            },
            (e) => {
                console.log('Reeeejected!', e);
            },
        );
    }

    public setupLines() {
        this.lines = (new Array(20).fill(null).map((_, idx) => new Line(idx / 20)));
        this.lines.forEach((line) => this.scene.add(line.lineObject));
    }

    public circlesMat = new cv.Mat();

    public animate() {
        now = performance.now();
        if (this.cap != null) {
            // console.time("read/apply");
            this.cap.read(this.frame); // 9 - 13ms
            this.fgbg.apply(this.frame, this.fgmask); // 45 - 55ms
            // console.timeEnd("read/apply");
            // cv.imshow('canvasOutput', this.fgmask); // 12 - 20ms

            // only access once for perf
            const fgmaskData = this.fgmask.data;
            const fgmaskWidth = this.fgmask.cols;
            const fgmaskHeight = this.fgmask.rows;

            // this.lines.forEach((line) => line.animate(this.camera, fgmaskData, fgmaskWidth, fgmaskHeight));
            for (let i = 0, l = this.particles.length; i < l; i++) {
                this.particles[i].animate(this.camera, fgmaskData, fgmaskWidth, fgmaskHeight);
            }
            this.particleGeometry.verticesNeedUpdate = true;
            this.particleGeometry.colorsNeedUpdate = true;
        }

        const t = now / 10000;
        this.filter.uniforms.iMouse.value = new THREE.Vector2(Math.sin(t) / 2, Math.cos(t) / 2);
        this.composer.render();
    }
})();
