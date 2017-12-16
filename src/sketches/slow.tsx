import * as React from "react";
import * as THREE from "three";

import { ISketch, SketchAudioContext } from "../sketch";

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
        this.geometry.vertices.forEach((vertex, index) => {
            const x = THREE.Math.mapLinear((performance.now() + this.offset * 1000) % 1000, 0, 1000, camera.left, camera.right);
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

    public init(renderer: THREE.WebGLRenderer, audioContext: SketchAudioContext) {
        this.renderer = renderer;
        this.renderer.autoClear = false;
        this.initVideo();
        this.setupCamera();
        this.setupLines();
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
        this.renderer.clear();
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
                this.fgbg = new cv.BackgroundSubtractorMOG2(60 * 50, 40, false);
            },
            (e) => {
                console.log('Reeeejected!', e);
            },
        );
    }

    public setupLines() {
        this.lines = (new Array(1000).fill(null).map((_, idx) => new Line(idx / 1000)));
        this.lines.forEach((line) => this.scene.add(line.lineObject));
    }

    public animate() {
        if (this.cap != null) {
            this.cap.read(this.frame); // 9 - 13ms
            this.fgbg.apply(this.frame, this.fgmask); // 45 - 55ms
            cv.imshow('canvasOutput', this.fgmask); // 12 - 20ms

            // only access once for perf
            const fgmaskData = this.fgmask.data;
            const fgmaskWidth = this.fgmask.cols;
            const fgmaskHeight = this.fgmask.rows;

            this.lines.forEach((line) => line.animate(this.camera, fgmaskData, fgmaskWidth, fgmaskHeight));
        }

        this.renderer.render(this.scene, this.camera);
    }
})();
