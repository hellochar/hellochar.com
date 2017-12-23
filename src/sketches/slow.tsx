import * as React from "react";
import * as THREE from "three";

import { ExplodeShader } from "../common/explodeShader";
import { ISketch, SketchAudioContext } from "../sketch";

const NUM_PARTICLES = 300000;
const INIT_PARTICLE_VELOCITY = 0.03;
const VELOCITY_POSITION_SCALAR = 0.0001;
const Y_VELOCITY_WAVE_TIMESCALAR = 1 / 10000;
const Y_VELOCITY_WAVE_AMPLITUDESCALAR = 0.0001;
const FREQ_SPREAD_TIMESCALAR = 1 / 30000;
const FREQ_MIN = 10000;
const FREQ_MAX = 30000;

const VIDEO_WIDTH = 200;
const VIDEO_HEIGHT = 150;

const BG_SUBTRACTOR_HISTORY = 60 * 10; // 60 frames per second * 10 seconds = 10 seconds of history
const BG_SUBTRACTOR_THRESHOLD = 8 * 8; // 8px value difference counts as foreground

const POINTS_MATERIAL = new THREE.PointsMaterial({
    vertexColors: THREE.VertexColors,
    transparent: true,
    opacity: 0.25,
    size: 2,
});

let now: number = 0;
class Particle {
    public velocity = new THREE.Vector3();

    public constructor(public position: Float32Array, public color: Float32Array) {
        this.randomizeVelocity();
    }

    public animate(camera: THREE.OrthographicCamera, fgmaskData: Uint8Array, fgmaskWidth: number, fgmaskHeight: number) {
        const pixelX = Math.floor(THREE.Math.mapLinear(this.position[0], camera.left, camera.right, 0, fgmaskWidth));
        const pixelY = Math.floor(THREE.Math.mapLinear(this.position[1], camera.top, camera.bottom, 0, fgmaskHeight));
        const pixelIndex = pixelY * fgmaskWidth + pixelX;
        const pixelValue = fgmaskData[pixelIndex] || 0;

        this.velocity.x += this.position[0] * VELOCITY_POSITION_SCALAR;
        this.velocity.y += this.position[1] * VELOCITY_POSITION_SCALAR;

        this.velocity.y -= Math.sin(now * Y_VELOCITY_WAVE_TIMESCALAR) * Y_VELOCITY_WAVE_AMPLITUDESCALAR;

        const movementScalar = pixelValue / 127 + 0.1;
        // this.color.setRGB(0.4, movementScalar / 1.5 + 0.4, 0.5 + movementScalar / 1.3);
        // // const movementScalar = 1;
        if (pixelValue > 0) {
            this.color[0] = 0;
            this.color[1] = 0;
            this.color[2] = 0;
        } else {
            this.color[0] = 1;
            this.color[1] = 1;
            this.color[2] = 1;
            // this.color.setRGB(0.4, movementScalar / 1.5 + 0.4, 0.5 + movementScalar / 1.3);
        }

        this.position[0] = this.position[0] + this.velocity.x * movementScalar;
        this.position[1] = this.position[1] + this.velocity.y * movementScalar,
        this.position[2] = 0;

        if (this.position[0] > camera.right ||
            this.position[0] < camera.left ||
            this.position[1] > camera.top ||
            this.position[1] < camera.bottom
        ) {
            this.randomizeVelocity();
            this.position[0] = 0;
            this.position[1] = 0;
            this.position[2] = 0;
        }
    }

    public randomizeVelocity() {
        const angle = Math.random() * Math.PI * 2;
        const frequency = THREE.Math.mapLinear(Math.cos(now * FREQ_SPREAD_TIMESCALAR), -1, 1, FREQ_MIN, FREQ_MAX);
        let velocitySpread = (Math.sin(now / frequency) + 1) / 2;
        velocitySpread *= velocitySpread;
        velocitySpread *= velocitySpread;
        velocitySpread = 1 - velocitySpread;
        const velocity = INIT_PARTICLE_VELOCITY * velocitySpread + Math.random() * INIT_PARTICLE_VELOCITY * (1 - velocitySpread);
        this.velocity.set(Math.cos(angle) * velocity, Math.sin(angle) * velocity, 0);
        this.color[0] = 1;
        this.color[1] = 1;
        this.color[2] = 1;
    }
}

export const Slow = new (class implements ISketch {
    public id = "slow";

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
        this.setupParticles();
        this.composer = new THREE.EffectComposer(renderer);
        this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
        const filter = this.filter = new THREE.ShaderPass(ExplodeShader);
        filter.uniforms.iResolution.value = new THREE.Vector2(renderer.domElement.width, renderer.domElement.height);
        filter.renderToScreen = true;
        this.composer.addPass(filter);
    }

    public particleBufferGeometry = new THREE.BufferGeometry();
    // public particleGeometry = new THREE.Geometry();
    public particlePoints: THREE.Points;
    public setupParticles() {
        const positionBuffer = new Float32Array(NUM_PARTICLES * 3);
        const colorBuffer = new Float32Array(NUM_PARTICLES * 3);
        const positionAttribute = new THREE.BufferAttribute(positionBuffer, 3);
        const colorAttribute = new THREE.BufferAttribute(colorBuffer, 3);
        this.particleBufferGeometry.addAttribute("position", positionAttribute);
        this.particleBufferGeometry.addAttribute("color", colorAttribute);
        this.particles = new Array(NUM_PARTICLES).fill(null).map((_, idx) => {
            // const position = new THREE.Vector3();
            // const color = new THREE.Color();
            // this.particleGeometry.vertices.push(position);
            // this.particleGeometry.colors.push(color);
            const position = new Float32Array(positionBuffer.buffer, 4 * 3 * idx, 3);
            const color = new Float32Array(colorBuffer.buffer, 4 * 3 * idx, 3);
            return new Particle(position, color);
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

        navigator.getUserMedia(
            constraints,
            (localMediaStream) => {
                const video = document.createElement("video");
                video.width = VIDEO_WIDTH;
                video.height = VIDEO_HEIGHT;
                video.autoplay = true;
                video.src = window.URL.createObjectURL(localMediaStream);

                this.cap = new cv.VideoCapture(video);

                this.frame = new cv.Mat(video.height, video.width, cv.CV_8UC4);
                this.fgmask = new cv.Mat(video.height, video.width, cv.CV_8UC1);
                this.fgbg = new cv.BackgroundSubtractorMOG2(BG_SUBTRACTOR_HISTORY, BG_SUBTRACTOR_THRESHOLD, false);
            },
            (e) => {
                console.log('Reeeejected!', e);
            },
        );
    }

    public animate() {
        now = performance.now();
        if (this.cap != null) {
            this.cap.read(this.frame);
            this.fgbg.apply(this.frame, this.fgmask);

            // only access once for perf
            const fgmaskData = this.fgmask.data;
            const fgmaskWidth = this.fgmask.cols;
            const fgmaskHeight = this.fgmask.rows;

            for (let i = 0, l = this.particles.length; i < l; i++) {
                this.particles[i].animate(this.camera, fgmaskData, fgmaskWidth, fgmaskHeight);
            }
            (this.particleBufferGeometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
            (this.particleBufferGeometry.getAttribute("color") as THREE.BufferAttribute).needsUpdate = true;
        }

        const t = now / 10000;
        this.filter.uniforms.iMouse.value = new THREE.Vector2(Math.sin(t) / 2, Math.cos(t) / 2);
        this.composer.render();
    }
})();
