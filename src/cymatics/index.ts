import * as $ from "jquery";
import * as THREE from "three";

import { map } from "../math";
import { ISketch, SketchAudioContext } from '../sketch';

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
    color: THREE.Color = new THREE.Color(0x000000);
    position: THREE.Vector3;
    height = 0;
    velocity = 0;
    force = 0;
    accumulatedHeight = 0;
    neighbors: Cell[] = [];
    positionFunction: (time: number) => number;

    constructor(position: THREE.Vector3) {
        this.position = position;
    }

    public addNeighbor(neighbor: Cell) {
        this.neighbors.push(neighbor);
    }

    public removeNeighbor(neighbor: Cell) {
        var index = this.neighbors.indexOf(neighbor);
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
        if (this.positionFunction != null) {
            return;
        }

        var neighbors = this.neighbors;
        for( var i = 0; i < neighbors.length; i++) {
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
        this.force = 0;
    }

    public updateColor() {
        if (this.neighbors.length === 0) {
            this.color.setHex(0x0591514);
        } else {
            // var colorFactor = Math.log(this.accumulatedHeight) / 6;
            // var colorFactor = this.accumulatedHeight / 20;
            var colorFactor = this.accumulatedHeight / 100;
            // var colorFactor = this.height / 9 + 0.5;
            this.color.setRGB(colorFactor, colorFactor, colorFactor);
        }
    }
}

/**
 * Grid fields:
 *
 * cells: Cell[][] - grid of cells
 */
class Grid {
    cells: Cell[][];
    width: number;
    height: number;
    time: number;

    constructor(width: number, height: number) {
        this.cells = [];
        this.width = width;
        this.height = height;
        this.time = 0;
        for(var x = 0; x < width; x++) {
            this.cells.push([]);
            for(var y = 0; y < height; y++) {
                var cell = new Cell(new THREE.Vector3(x, y, 0));
                this.cells[x].push(cell);
                if (x > 0) {
                    cell.addNeighbor(this.cells[x-1][y]);
                    this.cells[x-1][y].addNeighbor(cell);
                }
                if (y > 0) {
                    cell.addNeighbor(this.cells[x][y-1]);
                    this.cells[x][y-1].addNeighbor(cell);
                }
            }
        }
    }

    step() {
        for(var i = 0; i < 5; i++) {
            this.time += 1;
            for(var x = 0; x < this.width; x++) {
                for(var y = 0; y < this.height; y++) {
                    this.cells[x][y].setForce();
                }
            }
            for(var x = 0; x < this.width; x++) {
                for(var y = 0; y < this.height; y++) {
                    this.cells[x][y].step(this.time);
                }
            }
        }
        for(var x = 0; x < this.width; x++) {
            for(var y = 0; y < this.height; y++) {
                this.cells[x][y].updateColor();
            }
        }
    }
}

let grid: Grid;

let renderer: THREE.WebGLRenderer;
let camera: THREE.OrthographicCamera;
let scene: THREE.Scene;
let geometry: THREE.Geometry;
let material: THREE.PointCloudMaterial;
let pointCloud: THREE.PointCloud;
let raycaster: THREE.Raycaster;
let mousePressed = false;
let mousePosition = new THREE.Vector2(0, 0);

function init(_renderer: THREE.WebGLRenderer, _audioContext: SketchAudioContext) {
    renderer = _renderer;
    // renderer.autoClearColor = false;
    renderer.setClearColor(0xfcfcfc);
    renderer.clear();
    // camera = new THREE.PerspectiveCamera(60, renderer.domElement.width / renderer.domElement.height, 1, 400);
    var height = 420;
    var width = renderer.domElement.width / renderer.domElement.height * height;
    camera = new THREE.OrthographicCamera(-width/2, width/2, height/2, -height/2, 1, 400);
    camera.position.z = 170;

    scene = new THREE.Scene();

    grid = new Grid(Math.ceil(width), height + 1);
    grid.cells[Math.floor(grid.width/2)][Math.floor(grid.height/2)].positionFunction = (function() {
        var t = 0;
        return function() {
            t += 0.20 * Math.pow(2, map(mousePosition.x, -1, 1, -1, 1.6515));
            return 20 * Math.sin(t);
        };
    })();

    geometry = new THREE.Geometry();
    grid.cells.forEach(function (col) {
        col.forEach(function (cell) {
            geometry.vertices.push(cell.position);
            geometry.colors.push(cell.color);
        });
    });
    material = new THREE.PointCloudMaterial({
        size: renderer.domElement.height / height,
        sizeAttenuation: false,
        vertexColors: THREE.VertexColors
    });
    pointCloud = new THREE.PointCloud(geometry, material);
    pointCloud.position.set(-grid.width/2, -grid.height/2, 0);
    scene.add(pointCloud);

    raycaster = new THREE.Raycaster();
    (raycaster.params as any).PointCloud.threshold = 1;
}

function animate(dt: number) {
    if (mousePressed) {
        // raycast to find droplet location
        raycaster.setFromCamera(mousePosition, camera);
        var intersections = raycaster.intersectObject( pointCloud );
        intersections.forEach(function (intersection) {
            var index = intersection.index;
            var x = Math.floor(index / grid.height);
            var y = index % grid.height;

            var cell = grid.cells[x][y];
            cell.freeze();
        });
    }
    // controls.update();

    grid.step();

    geometry.colorsNeedUpdate = true;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    renderer.render(scene, camera);
}

function mousedown(event: JQuery.Event) {
    if (event.which === 1) {
        var mouseX = event.offsetX == undefined ? (event.originalEvent as MouseEvent).layerX : event.offsetX;
        var mouseY = event.offsetY == undefined ? (event.originalEvent as MouseEvent).layerY : event.offsetY;
        mousePosition.set(mouseX / renderer.domElement.width * 2 - 1, (1 - mouseY / renderer.domElement.height) * 2 - 1);
        mousePressed = true;
    }
}

function mousemove(event: JQuery.Event) {
        var mouseX = event.offsetX == undefined ? (event.originalEvent as MouseEvent).layerX : event.offsetX;
        var mouseY = event.offsetY == undefined ? (event.originalEvent as MouseEvent).layerY : event.offsetY;
        mousePosition.set(mouseX / renderer.domElement.width * 2 - 1, (1 - mouseY / renderer.domElement.height) * 2 - 1);
}

function mouseup(event: JQuery.Event) {
    if (event.which === 1) {
        mousePressed = false;
    }
}

export const Cymatics: ISketch = {
    id: "cymatics",
    init: init,
    animate: animate,
    mousedown: mousedown,
    mousemove: mousemove,
    mouseup: mouseup
};
