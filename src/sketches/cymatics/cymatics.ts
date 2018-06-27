import * as THREE from "three";

import GPUComputationRenderer, { GPUComputationRendererVariable } from "../../common/gpuComputationRenderer";
import { map } from "../../math";
import { ISketch } from "../../sketch";
import { RenderCymaticsShader } from "./renderCymaticsShader";

const COMPUTE_CELL_STATE = require("./computeCellState.frag");

let mousePressed = false;
const mousePosition = new THREE.Vector2(0, 0);
const lastMousePosition = new THREE.Vector2(0, 0);

const QUALITY = screen.width > 480 ? "high" : "low";

export class Cymatics extends ISketch {
    public events = {
        mousedown: (event: JQuery.Event) => {
            if (event.which === 1) {
                const mouseX = event.offsetX == null ? (event.originalEvent as MouseEvent).layerX : event.offsetX;
                const mouseY = event.offsetY == null ? (event.originalEvent as MouseEvent).layerY : event.offsetY;
                mousePosition.set(mouseX / this.canvas.width * 2 - 1, (1 - mouseY / this.canvas.height) * 2 - 1);
                mousePressed = true;
            }
        },

        mousemove: (event: JQuery.Event) => {
            const mouseX = event.offsetX == null ? (event.originalEvent as MouseEvent).layerX : event.offsetX;
            const mouseY = event.offsetY == null ? (event.originalEvent as MouseEvent).layerY : event.offsetY;
            mousePosition.set(mouseX / this.canvas.width * 2 - 1, (1 - mouseY / this.canvas.height) * 2 - 1);
        },

        mouseup: (event: JQuery.Event) => {
            if (event.which === 1) {
                mousePressed = false;
            }
        },

    };

    public id = "cymatics";

    public computation!: GPUComputationRenderer;

    public cellStateVariable!: GPUComputationRendererVariable;
    public renderCymaticsPass!: THREE.ShaderPass;
    public composer!: THREE.EffectComposer;

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
        this.cellStateVariable.material.uniforms.iMouse = { value: mousePosition.clone() };
        console.error(this.computation.init());

        // scene = new THREE.Scene();
        // camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 1);
        // camera.position.z = 0.5;
        // camera.lookAt(new THREE.Vector3());
        // scene.add(renderTexture);

        this.composer = new THREE.EffectComposer(this.renderer);
        this.renderCymaticsPass = new THREE.ShaderPass(RenderCymaticsShader);
        this.renderCymaticsPass.renderToScreen = true;
        this.renderCymaticsPass.uniforms.resolution.value.set(this.canvas.width, this.canvas.height);
        this.renderCymaticsPass.uniforms.cellStateResolution.value.set(this.computation.sizeX, this.computation.sizeY);
        this.composer.addPass(this.renderCymaticsPass);
    }

    public modelTime = 0;
    public numCycles = 1.002;

    public animate(dt: number) {

        // const wantedFrequency = 0.20 * Math.pow(2, map(mousePosition.x, -1, 1, -3, 1.6515));
        const numIterations = QUALITY === "high" ? 40 : 20;

        // we want an integer number of cycles
        // const numCycles = console.log(wantedFrequency * numIterations / (Math.PI * 2));
        // const numCycles = 1.00 + mousePosition.x * 0.03;
        // let numCycles = 1.002;
        if (mousePressed) {
            this.numCycles *= 1.001;
            // numCycles *= 2;
        } else {
            this.numCycles = this.numCycles * 0.5 + 1.002 * 0.5;
        }

        const wantedFrequency = this.numCycles * Math.PI * 2 / numIterations;
        this.cellStateVariable.material.uniforms.iMouse.value.lerp(mousePosition, 0.01);

        // const iterations = THREE.Math.smoothstep(this.frameCount, 0, 100) * numIterations;

        // so, i want to sample this at the right times.
        for (let i = 0; i < numIterations; i++) {
            this.cellStateVariable.material.uniforms.iGlobalTime.value = this.modelTime; // performance.now() / 1000; // this.timeElapsed / 1000;
            this.computation.compute();
            this.modelTime += wantedFrequency;
            // this.modelTime += 0.20 * Math.pow(2, map(mousePosition.x, -1, 1, 1.6, 3.6515));

            // this.modelTime += 1;
        }
        this.renderCymaticsPass.uniforms.cellStateVariable.value = this.computation.getCurrentRenderTarget(this.cellStateVariable).texture;
        this.composer.render();
    }

    resize(width: number, height: number) {
        this.renderCymaticsPass.uniforms.resolution.value.set(width, height);
    }
}
