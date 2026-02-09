import * as React from "react";
import * as THREE from "three";

import Worker = require('worker-loader!./worker');
import { ExplodeShader } from "../../common/explodeShader";
import { ISketch, SketchAudioContext } from "../../sketch";
import WebcamBackgroundSubtractor from "../webcamBackgroundSubtractor";
import { NUM_PARTICLES, NUM_WORKERS, VIDEO_HEIGHT, VIDEO_WIDTH } from "./constants";
import { IForegroundUpdateMessage, IPositionColorUpdateResponse } from "./interfaces";

let now: number = 0;
class DontMove extends ISketch {
    public scene = new THREE.Scene();
    private camera = new THREE.OrthographicCamera(0, 1, 0, 1, 1, 1000);
    public filter = new THREE.ShaderPass(ExplodeShader);
    public composer!: THREE.EffectComposer;

    private POINTS_MATERIAL = new THREE.PointsMaterial({
        vertexColors: THREE.VertexColors,
        transparent: true,
        opacity: 0.25,
        size: 2,
    });

    private workers: Worker[] = [];

    public backgroundSubtractor = new WebcamBackgroundSubtractor(VIDEO_WIDTH, VIDEO_HEIGHT);

    public init() {
        this.initWorkers();
        this.initBackgroundSubtractor();
        this.setupCamera();
        this.setupParticles();
        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
        this.filter.uniforms.iResolution.value = this.resolution;
        this.filter.renderToScreen = true;
        this.composer.addPass(this.filter);
    }

    private initWorkers() {
        for (let i = 0; i < NUM_WORKERS; i++) {
            const worker = new Worker();
            this.workers.push(worker);
        }
    }

    private initBackgroundSubtractor() {
        this.backgroundSubtractor.init();
    }

    public particleBufferGeometry = new THREE.BufferGeometry();
    public particlePoints!: THREE.Points;
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

        this.workers.forEach((worker, idx) => {
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
            this.POINTS_MATERIAL,
        );
        this.scene.add(this.particlePoints);
    }

    public setupCamera() {
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

    public animate() {
        now = performance.now();
        const fgmask = this.backgroundSubtractor.update();
        if (fgmask != null) {
            const fgmaskData = fgmask.data.slice();

            this.workers.forEach((worker, idx) => {
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
}

export default DontMove;
