import * as THREE from "three";

import GPUComputationRenderer, { GPUComputationRendererVariable } from "../../common/gpuComputationRenderer";
import { map } from "../../math";
import { ISketch } from "../../sketch";
import { RenderCymaticsShader } from "./renderCymaticsShader";

const COMPUTE_CELL_STATE = require("./computeCellState.frag");

const FORCE_CONSTANT = 0.25;

/**
 * Cell fields:
 *
 * position: Vector3 - position of this cell (used in the Geometry)
 * color: Color - color of this cell (used in the Geometry)
 * height: number - current height of the cell
 * velocity: number - current rate of change of z at this position
 * neighbors: Cell[] - other cells to take into account when deciding new height/velocity
 *
 * At each timestep we calculate the force for this cell based on height and velocity of self and neighbors, and then integrate the force and velocity.
 *
 * The basic formula for determining force is to pretend that, for each neighbor, there is a spring attached between this cell and that one. The force for one neighbor cell c is (c.height - height) * k, where k is some spring parameter (possibly constant throughout the entire system).
 * The total force is then sum_neighbors(k*(c.height - height))
 */
class Cell {
    public color: THREE.Color = new THREE.Color(0x000000);
    public position: THREE.Vector3;
    public height = 0;
    public velocity = 0;
    public force = 0;
    public accumulatedHeight = 0;
    public neighbors: Cell[] = [];
    public positionFunction?: (time: number) => number;

    constructor(position: THREE.Vector3) {
        this.position = position;
    }

    public addNeighbor(neighbor: Cell) {
        this.neighbors.push(neighbor);
    }

    public removeNeighbor(neighbor: Cell) {
        const index = this.neighbors.indexOf(neighbor);
        if (index >= 0) {
            this.neighbors.splice(index, 1);
        }
    }

    public freeze() {
        this.neighbors.forEach((neighbor) => {
            neighbor.removeNeighbor(this);
        });
        this.neighbors = [];

        this.height = 0;
        this.accumulatedHeight = 0;
    }

    public setForce() {
        this.force = 0;
        if (this.positionFunction != null) {
            return;
        }

        const neighbors = this.neighbors;
        for ( let i = 0; i < neighbors.length; i++) {
            this.force += neighbors[i].height - this.height;
        }
        this.force *= FORCE_CONSTANT;
    }

    public step(time: number) {
        if (this.positionFunction != null) {
            this.height = this.positionFunction(time);
        } else {
            this.velocity += this.force;
            this.velocity *= 0.98718;
            this.height += this.velocity;
        }
        // this.accumulatedHeight = (this.accumulatedHeight + Math.abs(this.height) / (this.accumulatedHeight + 1)) * 0.99;
        this.accumulatedHeight = (this.accumulatedHeight + Math.abs(this.height)) * 0.99;
        // this.accumulatedHeight = (this.accumulatedHeight + this.height) * 0.99;
    }

    public updateColor() {
        if (this.neighbors.length === 0) {
            this.color.setHex(0x0591514);
        } else {
            // var colorFactor = Math.log(this.accumulatedHeight) / 6;
            // var colorFactor = this.accumulatedHeight / 20;
            const colorFactor = this.accumulatedHeight / 100;
            // var colorFactor = this.height / 9 + 0.5;
            // this.color.setRGB(colorFactor, colorFactor, colorFactor);

            const h = ((((this.height + 5) / 10) % 1) + 1) % 1;
            // const h = this.height > 0 ? 0 : 0.5;
            // const s = (this.velocity + 10) / 20;
            // const s = (this.force + 10) / 20;
            // const brightness = Math.sqrt(Math.abs(h - 0.5));
            // const brightness = Math.abs(this.force);
            // const brightness = colorFactor;
            // const h = (this.force + 10) / 20;
            this.color.setHSL(
                h,
                1,
                colorFactor,
            );
        }
    }
}

/**
 * Grid fields:
 *
 * cells: Cell[][] - grid of cells
 */
class Grid {
    public cells: Cell[][];
    public width: number;
    public height: number;
    public time: number;

    constructor(width: number, height: number) {
        this.cells = [];
        this.width = width;
        this.height = height;
        this.time = 0;
        for (let x = 0; x < width; x++) {
            this.cells.push([]);
            for (let y = 0; y < height; y++) {
                const cell = new Cell(new THREE.Vector3(x, y, 0));
                this.cells[x].push(cell);
                if (x > 0) {
                    cell.addNeighbor(this.cells[x - 1][y]);
                    this.cells[x - 1][y].addNeighbor(cell);
                }
                if (y > 0) {
                    cell.addNeighbor(this.cells[x][y - 1]);
                    this.cells[x][y - 1].addNeighbor(cell);
                }
            }
        }
    }

    public step() {
        for (let i = 0; i < 5; i++) {
            this.time += 1;
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    this.cells[x][y].setForce();
                }
            }
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    this.cells[x][y].step(this.time);
                }
            }
        }
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.cells[x][y].updateColor();
            }
        }
    }
}

let grid: Grid;

let camera: THREE.OrthographicCamera;
let scene: THREE.Scene;
let geometry: THREE.Geometry;
let material: THREE.PointsMaterial;
let pointCloud: THREE.Points;
let raycaster: THREE.Raycaster;
let mousePressed = false;
const mousePosition = new THREE.Vector2(0, 0);
const lastMousePosition = new THREE.Vector2(0, 0);

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
        this.computation = new GPUComputationRenderer(512, 512, this.renderer);
        const initialTexture = this.computation.createTexture();
        this.cellStateVariable = this.computation.addVariable("cellStateVariable", COMPUTE_CELL_STATE, initialTexture);
        this.cellStateVariable.wrapS = THREE.MirroredRepeatWrapping;
        this.cellStateVariable.wrapT = THREE.MirroredRepeatWrapping;
        this.computation.setVariableDependencies(this.cellStateVariable, [this.cellStateVariable]);
        this.cellStateVariable.material.uniforms.iGlobalTime = { value: 0 };
        this.cellStateVariable.material.uniforms.iMouse = { value: mousePosition };
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

    public animate(dt: number) {

        // const wantedFrequency = 0.20 * Math.pow(2, map(mousePosition.x, -1, 1, -3, 1.6515));
        const numIterations = 40;

        // we want an integer number of cycles
        // const numCycles = console.log(wantedFrequency * numIterations / (Math.PI * 2));
        // const numCycles = 1.00 + mousePosition.x * 0.03;
        let numCycles = 1.002;
        if (mousePressed) {
            numCycles *= 2;
        }

        const wantedFrequency = numCycles * Math.PI * 2 / numIterations;
        this.cellStateVariable.material.uniforms.iMouse.value.copy(mousePosition);

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
