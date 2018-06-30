import * as THREE from "three";

import GPUComputationRenderer, { GPUComputationRendererVariable } from "../../common/gpuComputationRenderer";
import { map, mirroredRepeat } from "../../math";
import { ISketch } from "../../sketch";
import { CymaticsAudio } from "./audio";
import { RenderCymaticsShader } from "./renderCymaticsShader";

const COMPUTE_CELL_STATE = require("./computeCellState.frag");

let mousePressed = false;
const mousePosition = new THREE.Vector2(0, 0);
const lastMousePosition = new THREE.Vector2(0, 0);

const QUALITY = screen.width > 480 ? "high" : "low";

// an integer makes perfect standing waves. the 0.002 means that the wave will oscillate very slightly per frame; 500 frames per oscillation period
const DEFAULT_NUM_CYCLES = 1.002;
// const DEFAULT_NUM_CYCLES = 0.502;

const GROW_AMOUNT_MIN = 0.0;

export class Cymatics extends ISketch {
    public slowDownAmount = 0;
    public events = {
        touchstart: (event: JQuery.Event) => {
            // prevent emulated mouse events from occuring
            event.preventDefault();
            const touch = (event.originalEvent as TouchEvent).touches[0];
            const touchX = touch.pageX;
            const touchY = touch.pageY;
            this.startInteraction(touchX, touchY);
        },

        touchmove: (event: JQuery.Event) => {
            const touch = (event.originalEvent as TouchEvent).touches[0];
            const touchX = touch.pageX;
            const touchY = touch.pageY;
            this.setMouse(touchX, touchY);
        },

        touchend: (event: JQuery.Event) => {
            mousePressed = false;
        },

        mousedown: (event: JQuery.Event) => {
            if (event.which === 1) {
                const mouseX = event.offsetX == null ? (event.originalEvent as MouseEvent).layerX : event.offsetX;
                const mouseY = event.offsetY == null ? (event.originalEvent as MouseEvent).layerY : event.offsetY;
                this.startInteraction(mouseX, mouseY);
            }
        },

        mousemove: (event: JQuery.Event) => {
            const mouseX = event.offsetX == null ? (event.originalEvent as MouseEvent).layerX : event.offsetX;
            const mouseY = event.offsetY == null ? (event.originalEvent as MouseEvent).layerY : event.offsetY;
            this.setMouse(mouseX, mouseY);
        },

        mouseup: (event: JQuery.Event) => {
            mousePressed = false;
        },
    };

    startInteraction(pixelX: number, pixelY: number) {
        this.setMouse(pixelX, pixelY);
        mousePressed = true;
        this.slowDownAmount += 1;
        this.audio.triggerJitter();
    }

    setMouse(pixelX: number, pixelY: number) {
        mousePosition.set(pixelX / this.canvas.width * 2 - 1, (1 - pixelY / this.canvas.height) * 2 - 1);
    }

    public id = "cymatics";

    public computation!: GPUComputationRenderer;

    public cellStateVariable!: GPUComputationRendererVariable;
    public renderCymaticsPass!: THREE.ShaderPass;
    public composer!: THREE.EffectComposer;
    public audio!: CymaticsAudio;

    public init() {
        this.renderer.setClearColor(0xfcfcfc);
        this.renderer.clear();
        if (QUALITY === "high") {
            this.computation = new GPUComputationRenderer(512, 512, this.renderer);
        } else {
            this.computation = new GPUComputationRenderer(256, 256, this.renderer);
        }
        const initialTexture = this.computation.createTexture();
        this.cellStateVariable = this.computation.addVariable("cellStateVariable", COMPUTE_CELL_STATE, initialTexture);
        // this.cellStateVariable.minFilter = THREE.NearestFilter;
        // this.cellStateVariable.magFilter = THREE.NearestFilter;
        this.cellStateVariable.wrapS = THREE.MirroredRepeatWrapping;
        this.cellStateVariable.wrapT = THREE.MirroredRepeatWrapping;
        this.computation.setVariableDependencies(this.cellStateVariable, [this.cellStateVariable]);
        this.cellStateVariable.material.uniforms.iGlobalTime = { value: 0 };
        // this.cellStateVariable.material.uniforms.iMouse = { value: mousePosition.clone() };
        this.cellStateVariable.material.uniforms.center = { value: new THREE.Vector2(0.5, 0.5) };
        this.cellStateVariable.material.uniforms.growAmount = { value: GROW_AMOUNT_MIN };
        const computationInitError = this.computation.init();
        if (computationInitError != null) {
            console.error(computationInitError);
            throw computationInitError;
        }

        this.composer = new THREE.EffectComposer(this.renderer);
        this.renderCymaticsPass = new THREE.ShaderPass(RenderCymaticsShader);
        this.renderCymaticsPass.renderToScreen = true;
        this.renderCymaticsPass.uniforms.resolution.value.set(this.canvas.width, this.canvas.height);
        this.renderCymaticsPass.uniforms.cellStateResolution.value.set(this.computation.sizeX, this.computation.sizeY);
        this.composer.addPass(this.renderCymaticsPass);
        this.audio = new CymaticsAudio(this.audioContext);
    }

    public simulationTime = 0;
    public numCycles = DEFAULT_NUM_CYCLES;
    public get growAmount() {
        return this.cellStateVariable.material.uniforms.growAmount.value;
    }

    public set growAmount(t: number) {
        this.cellStateVariable.material.uniforms.growAmount.value = t;
    }

    public animate(dt: number) {
        if (mousePressed) {
            this.numCycles += .0003 + (this.numCycles - DEFAULT_NUM_CYCLES) * 0.0008;
            // numCycles *= 2;
            if (this.growAmount < 0.5) {
                this.growAmount = 0.5;
            }
            // target grow amount of 5, so if user holds the mouse we have some buffer time when it fills up the screen
            this.growAmount = this.growAmount * 0.99 + 7.5 * 0.01;
        } else {
            this.growAmount = this.growAmount * 0.995 + GROW_AMOUNT_MIN * 0.005;
            this.numCycles = this.numCycles * 0.95 + DEFAULT_NUM_CYCLES * 0.05;
        }
        const wantedCenter = new THREE.Vector2(0.5, 0.5);

        // mimic code from renderCymatics.frag
        const aspectRatioFrag = 1 / this.aspectRatio;
        if (aspectRatioFrag > 1.0) {
            // widescreen; split the window into left/right halves
            const screenCoord = mousePosition.clone().multiplyScalar(0.5);
            const normCoord = screenCoord.multiply(new THREE.Vector2(aspectRatioFrag, 1));
            const uv = normCoord.add(new THREE.Vector2(1, 0.5));
            wantedCenter.x = mirroredRepeat(uv.x);
            wantedCenter.y = mirroredRepeat(uv.y);
        } else {
            // tallscreen; split the window into top/bottom
            const screenCoord = mousePosition.clone().multiplyScalar(0.5);
            const normCoord = screenCoord.multiply(new THREE.Vector2(1, 1 / aspectRatioFrag));
            const uv = normCoord.add(new THREE.Vector2(0.5, 1.0));
            wantedCenter.x = mirroredRepeat(uv.x);
            wantedCenter.y = mirroredRepeat(uv.y);
        }
        const lerpAlpha = 0.01;

        // how fast the center's moving; max is about 0.06
        const centerSpeed = wantedCenter.distanceTo(this.cellStateVariable.material.uniforms.center.value) * lerpAlpha;
        this.cellStateVariable.material.uniforms.center.value.lerp(wantedCenter, lerpAlpha);

        const skewIntensity = Math.pow(Math.max(0, (this.numCycles - DEFAULT_NUM_CYCLES) / 2. - 0.5), 2);

        // grows louder as there's more growAmount, and also when it moves faster
        const blubVolume = THREE.Math.clamp(Math.pow(THREE.Math.mapLinear(this.growAmount, GROW_AMOUNT_MIN, 1.0, 0.05, 1), 2), 0, 1) * 0.5
                    + Math.abs(this.numCycles - DEFAULT_NUM_CYCLES) * 0.25
                    - skewIntensity
                    + THREE.Math.mapLinear(centerSpeed, 0, 0.005, 0, 1) * THREE.Math.mapLinear(this.growAmount, GROW_AMOUNT_MIN, 1.0, 0.12, 1) * 0.4;
        this.audio.setBlubVolume(blubVolume);
        // play slowly when there's no movement, play faster when there's a lot of movement
        const playbackRate = Math.pow(2, THREE.Math.mapLinear(centerSpeed, 0, 0.005, -0.25, 1.5)) + THREE.Math.mapLinear(this.numCycles, DEFAULT_NUM_CYCLES, 2, 0., 4.);
        this.audio.setBlubPlaybackRate(playbackRate);
        // console.log("playback:", playbackRate.toFixed(2), "volume:", volume.toFixed(2));

        this.audio.setOscVolume(THREE.Math.clamp(THREE.Math.smoothstep(this.numCycles, DEFAULT_NUM_CYCLES, DEFAULT_NUM_CYCLES * 1.1) * 0.5, 0, 1));
        const cycles = (this.numCycles) / (1 + this.slowDownAmount * 3);
        const frequencyScalar = cycles / DEFAULT_NUM_CYCLES;
        this.audio.setOscFrequencyScalar(frequencyScalar);

        const numIterations = QUALITY === "high" ? 40 : 20;
        const wantedSimulationDt = cycles * Math.PI * 2 / numIterations;
        for (let i = 0; i < numIterations; i++) {
            this.cellStateVariable.material.uniforms.iGlobalTime.value = this.simulationTime;
            this.computation.compute();
            this.simulationTime += wantedSimulationDt;
        }

        this.renderCymaticsPass.uniforms.skewIntensity.value = skewIntensity;
        this.renderCymaticsPass.uniforms.cellStateVariable.value = this.computation.getCurrentRenderTarget(this.cellStateVariable).texture;
        this.composer.render();

        this.slowDownAmount *= 0.95;
    }

    resize(width: number, height: number) {
        this.renderCymaticsPass.uniforms.resolution.value.set(width, height);
    }
}
