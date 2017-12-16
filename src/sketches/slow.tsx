import * as React from "react";
import * as THREE from "three";

import { ISketch, SketchAudioContext } from "../sketch";
// import Worker from 'worker-loader!./worker';

// const worker = new Worker();

// worker.postMessage({ a: 1 });
// worker.onmessage = (event) => {};

// worker.addEventListener("message", (event) => {});

class Particle {
    public velocity = new THREE.Vector3();

    public constructor(public position: THREE.Vector3, public color: THREE.Color) {
        this.velocity.set(Math.random() / 100, Math.random() / 100, 0);
    }

    public animate(camera: THREE.OrthographicCamera, fgmaskData: Uint8Array, fgmaskWidth: number, fgmaskHeight: number) {
        this.position.add(this.velocity);
        if (this.position.x > camera.right) {
            this.position.x = camera.right;
            this.velocity.x *= -1;
        } else if (this.position.x < camera.left) {
            this.position.x = camera.left;
            this.velocity.x *= -1;
        }

        if (this.position.y > camera.top) {
            this.position.y = camera.top;
            this.velocity.y *= -1;
        } else if (this.position.y < camera.bottom) {
            this.position.y = camera.bottom;
            this.velocity.y *= -1;
        }
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
    }
}

export const Slow = new (class implements ISketch {
    public id = "slow";

    public lines: Line[];
    public scene = new THREE.Scene();
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.OrthographicCamera;
    public particles: Particle[];

    public init(renderer: THREE.WebGLRenderer, audioContext: SketchAudioContext) {
        this.renderer = renderer;
        this.renderer.setClearColor(0xffffff);
        this.renderer.clear();
        this.initVideo();
        this.setupCamera();
        // this.setupLines();
        this.setupParticles();
    }

    public particleGeometry = new THREE.Geometry();
    public particlePoints: THREE.Points;
    public setupParticles() {
        this.particles = new Array(10000).fill(null).map(() => {
            const position = new THREE.Vector3();
            const color = new THREE.Color(0, 0.5, 0.7);
            this.particleGeometry.vertices.push(position);
            this.particleGeometry.colors.push(color);
            return new Particle(position, color);
        });
        this.particlePoints = new THREE.Points(
            this.particleGeometry,
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
        console.log(this.camera);
        this.camera.updateProjectionMatrix();

        this.renderer.setClearColor(0xffffff);
        this.renderer.setClearAlpha(1);
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
            video: {
                aspectRatio: 16 / 9,
            },
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
        if (this.cap != null) {
            if (performance.now() % 100 < 25) {
                // console.time("read/apply");
                this.cap.read(this.frame); // 9 - 13ms
                this.fgbg.apply(this.frame, this.fgmask); // 45 - 55ms
                // console.timeEnd("read/apply");
                cv.imshow('canvasOutput', this.fgmask); // 12 - 20ms
                // console.time("HoughCircles");
                // cv.HoughCircles(this.fgmask, this.circlesMat, cv.HOUGH_GRADIENT,
                //     1, 45, 75, 40, 0, 0);
                // console.timeEnd("HoughCircles");
                // for (let i = 0; i < this.circlesMat.cols; ++i) {
                //     let x = this.circlesMat.data32F[i * 3];
                //     let y = this.circlesMat.data32F[i * 3 + 1];
                //     let radius = this.circlesMat.data32F[i * 3 + 2];
                //     console.log(x, y, radius);
                // }
            }

            // only access once for perf
            const fgmaskData = this.fgmask.data;
            const fgmaskWidth = this.fgmask.cols;
            const fgmaskHeight = this.fgmask.rows;

            // this.lines.forEach((line) => line.animate(this.camera, fgmaskData, fgmaskWidth, fgmaskHeight));
            this.particles.forEach((p) => p.animate(this.camera, fgmaskData, fgmaskWidth, fgmaskHeight));
            this.particleGeometry.verticesNeedUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }
})();
