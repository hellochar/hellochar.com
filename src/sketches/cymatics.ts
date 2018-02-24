import * as $ from "jquery";
import * as THREE from "three";

import { lerp, map } from "../math";
import { ISketch, SketchAudioContext } from "../sketch";

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
    public positionFunction: (time: number) => number;

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

function mousedown(event: JQuery.Event) {
    if (event.which === 1) {
        const mouseX = event.offsetX == null ? (event.originalEvent as MouseEvent).layerX : event.offsetX;
        const mouseY = event.offsetY == null ? (event.originalEvent as MouseEvent).layerY : event.offsetY;
        mousePosition.set(mouseX / Cymatics.renderer.domElement.width * 2 - 1, (1 - mouseY / Cymatics.renderer.domElement.height) * 2 - 1);
        mousePressed = true;
    }
}

function mousemove(event: JQuery.Event) {
        const mouseX = event.offsetX == null ? (event.originalEvent as MouseEvent).layerX : event.offsetX;
        const mouseY = event.offsetY == null ? (event.originalEvent as MouseEvent).layerY : event.offsetY;
        mousePosition.set(mouseX / Cymatics.renderer.domElement.width * 2 - 1, (1 - mouseY / Cymatics.renderer.domElement.height) * 2 - 1);
}

function mouseup(event: JQuery.Event) {
    if (event.which === 1) {
        mousePressed = false;
    }
}

const Cymatics = new (class extends ISketch {
    public events = {
        mousedown,
        mousemove,
        mouseup,
    };

    public id = "cymatics";

    public init() {
        // renderer.autoClearColor = false;
        this.renderer.setClearColor(0xfcfcfc);
        this.renderer.clear();
        // camera = new THREE.PerspectiveCamera(60, renderer.domElement.width / renderer.domElement.height, 1, 400);
        const height = 200;
        const width = height / this.aspectRatio;
        camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 1, 400);
        camera.position.z = 170;

        scene = new THREE.Scene();

        grid = new Grid(Math.ceil(width), height + 1);
        grid.cells[Math.floor(grid.width / 2)][Math.floor(grid.height / 2)].positionFunction = (() => {
            let t = 0;
            return () => {
                // t += 0.20 * Math.pow(2, map(mousePosition.x, -1, 1, -1, 1.6515));
                t += 0.20 * Math.pow(2, map(mousePosition.x, -1, 1, -3, 1.6515));
                return 20 * Math.sin(t);
            };
        })();

        geometry = new THREE.Geometry();
        grid.cells.forEach((col) => {
            col.forEach((cell) => {
                geometry.vertices.push(cell.position);
                geometry.colors.push(cell.color);
            });
        });
        material = new THREE.PointsMaterial({
            size: this.renderer.domElement.height / height,
            sizeAttenuation: false,
            vertexColors: THREE.VertexColors,
        });
        pointCloud = new THREE.Points(geometry, material);
        pointCloud.position.set(-grid.width / 2, -grid.height / 2, 0);
        scene.add(pointCloud);

        raycaster = new THREE.Raycaster();
        (raycaster.params as any).PointCloud.threshold = 1;
    }

    public animate(dt: number) {
        if (mousePressed) {
            const gridStart = new THREE.Vector2();
            const gridEnd = new THREE.Vector2();
            // raycast to find droplet location
            raycaster.setFromCamera(mousePosition, camera);
            raycaster.intersectObject(pointCloud).forEach((intersection) => {
                const { index } = intersection;
                const x = Math.floor(index / grid.height);
                const y = index % grid.height;

                gridStart.set(x, y);
            });

            raycaster.setFromCamera(lastMousePosition, camera);
            raycaster.intersectObject(pointCloud).forEach((intersection) => {
                const { index } = intersection;
                const x = Math.floor(index / grid.height);
                const y = index % grid.height;

                gridEnd.set(x, y);
            });

            const dist = gridStart.distanceTo(gridEnd);
            for (let i = 0; i <= dist; i++) {
                const lerped = new THREE.Vector2(gridStart.x, gridStart.y);
                if (dist > 0) {
                    lerped.lerp(gridEnd, i / dist);
                }
                const {x, y} = lerped.floor();

                const cell = grid.cells[x][y];
                cell.freeze();
            }
        }

        grid.step();

        geometry.colorsNeedUpdate = true;
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.renderer.render(scene, camera);
        lastMousePosition.set(mousePosition.x, mousePosition.y);
    }
})();

export default Cymatics;
