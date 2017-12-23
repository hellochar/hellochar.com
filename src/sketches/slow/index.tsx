import * as React from "react";
import * as THREE from "three";

import Worker = require('worker-loader!./worker');
import { ExplodeShader } from "../../common/explodeShader";
import { ISketch, SketchAudioContext } from "../../sketch";
import { NUM_PARTICLES, NUM_WORKERS, VIDEO_HEIGHT, VIDEO_WIDTH } from "./constants";
import { IForegroundUpdateMessage, IPositionColorUpdateResponse } from "./interfaces";

const workers: Worker[] = [];
for (let i = 0; i < NUM_WORKERS; i++) {
    const worker = new Worker();
    workers.push(worker);
}

const BG_SUBTRACTOR_HISTORY = 60 * 10; // 60 frames per second * 10 seconds = 10 seconds of history
const BG_SUBTRACTOR_THRESHOLD = 8 * 8; // 8px value difference counts as foreground

const POINTS_MATERIAL = new THREE.PointsMaterial({
    vertexColors: THREE.VertexColors,
    transparent: true,
    opacity: 0.25,
    size: 2,
});

let now: number = 0;
export const Slow = new (class implements ISketch {
    public id = "slow";

    public scene = new THREE.Scene();
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.OrthographicCamera;

    public composer: THREE.EffectComposer;
    public filter: THREE.ShaderPass;

    public audioContext: SketchAudioContext;

    public init(renderer: THREE.WebGLRenderer, audioContext: SketchAudioContext) {
        this.renderer = renderer;
        this.audioContext = audioContext;
        this.initVideo();
        this.setupCamera();
        this.setupParticles();
        this.composer = new THREE.EffectComposer(renderer);
        this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
        const filter = this.filter = new THREE.ShaderPass(ExplodeShader);
        filter.uniforms.iResolution.value = new THREE.Vector2(renderer.domElement.width, renderer.domElement.height);
        filter.renderToScreen = true;
        this.composer.addPass(filter);
    }

    public particleBufferGeometry = new THREE.BufferGeometry();
    public particlePoints: THREE.Points;
    public setupParticles() {
        // filler for now
        const positions = new Float32Array(NUM_PARTICLES * 3);
        const colors = new Float32Array(NUM_PARTICLES * 3);
        const positionAttribute = new THREE.BufferAttribute(positions, 3);
        // positionAttribute.setDynamic(true);
        const colorAttribute = new THREE.BufferAttribute(colors, 3);
        // colorAttribute.setDynamic(true);

        this.particleBufferGeometry.addAttribute("position", positionAttribute);
        this.particleBufferGeometry.addAttribute("color", colorAttribute);

        workers.forEach((worker, idx) => {
            worker.addEventListener("message", (e) => {
                // console.log("main received");
                const response: IPositionColorUpdateResponse = e.data;
                if (response.type === "positionColorUpdate") {
                    const startIndex = idx / NUM_WORKERS * NUM_PARTICLES;
                    console.time(`received update on ${startIndex}, ${response.positions.length}`);
                    positions.set(response.positions, startIndex);
                    colors.set(response.colors, startIndex);
                    console.timeEnd(`received update on ${startIndex}, ${response.positions.length}`);
                    // positionAttribute.setArray(response.positions);
                    // colorAttribute.setArray(response.colors);
                    positionAttribute.needsUpdate = true;
                    colorAttribute.needsUpdate = true;
                }
            });
        });

        this.particlePoints = new THREE.Points(
            this.particleBufferGeometry,
            POINTS_MATERIAL,
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
        const constraints: MediaStreamConstraints = { video: true };

        navigator.mediaDevices.getUserMedia(constraints).then((localMediaStream) => {
            const video = document.createElement("video");
            video.width = VIDEO_WIDTH;
            video.height = VIDEO_HEIGHT;
            video.autoplay = true;
            video.srcObject = localMediaStream;

            this.cap = new cv.VideoCapture(video);

            this.frame = new cv.Mat(video.height, video.width, cv.CV_8UC4);
            this.fgmask = new cv.Mat(video.height, video.width, cv.CV_8UC1);
            this.fgbg = new cv.BackgroundSubtractorMOG2(BG_SUBTRACTOR_HISTORY, BG_SUBTRACTOR_THRESHOLD, false);
        }).catch((e) => {
            console.log('Reeeejected!', e);
        });
    }

    public animate() {
        now = performance.now();
        if (this.cap != null) {
            this.cap.read(this.frame);
            this.fgbg.apply(this.frame, this.fgmask);

            // only access once for perf
            const fgmaskData = this.fgmask.data.slice();

            workers.forEach((worker, idx) => {
                const message: IForegroundUpdateMessage = {
                    camera: {
                        left: this.camera.left,
                        right: this.camera.right,
                        top: this.camera.top,
                        bottom: this.camera.bottom,
                    },
                    fgmaskData,
                    // fgmaskData: fgmaskData.toString(),
                    now,
                    type: "foregroundUpdate",
                };
                worker.postMessage(message);
            });
        }

        const t = now / 10000;
        this.filter.uniforms.iMouse.value = new THREE.Vector2(Math.sin(t) / 2, Math.cos(t) / 2);
        this.composer.render();
    }
})();
