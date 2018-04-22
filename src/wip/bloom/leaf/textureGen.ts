import Delaunator from "delaunator";
import * as THREE from "three";

import { LeafNode, LeafSkeleton } from "./leafSkeleton";
import { SkinnedLeaf } from "./skinnedLeaf";
import { VeinedLeaf } from "../vein/veinedLeaf";

/* construct a texture from a mesh

1. normalize all bone points such that the total skeleton is box length 1

*/

class LeafCell {
    public position: THREE.Vector2;
    public nextPosition = new THREE.Vector2();
    constructor(public generator: LeafTextureGenerator) {
        this.position = new THREE.Vector2(
            THREE.Math.randFloat(0, generator.width),
            THREE.Math.randFloat(0, generator.height),
        );
    }

    computeNextPosition(cells: LeafCell[]) {
        this.nextPosition.copy(this.position);
        for (const cell of cells) {
            if (cell === this) {
                continue;
            }
            // run away from nearby cells
            const dist = this.position.distanceTo(cell.position);
            const force = 35 / dist;
            if (Number.isFinite(force)) {
                this.nextPosition.x += (this.position.x - cell.position.x) / dist * force;
                this.nextPosition.y += (this.position.y - cell.position.y) / dist * force;
            }
            // attract towards 0, 512
            const offsetCenterX = 0 - this.position.x;
            const offsetCenterY = 512 - this.position.y;
            const distCenter2 = offsetCenterX * offsetCenterX + offsetCenterY * offsetCenterY;
            const distCenter = Math.sqrt(distCenter2);
            if (Number.isFinite(distCenter)) {
                this.nextPosition.x += 0.02 * offsetCenterX / distCenter;
                this.nextPosition.y += 0.02 * offsetCenterY / distCenter;
            }
        }
        this.generator.pixelBounds.clampPoint(this.nextPosition, this.nextPosition);
    }

    updatePosition() {
        if (Number.isNaN(this.nextPosition.x)) {
            debugger;
        }
        this.position.copy(this.nextPosition);
    }
}

export class LeafTextureGenerator {
    public width = 2048;
    public height = 2048;
    private boundingBox: THREE.Box3;
    // private cells!: LeafCell[];
    public pixelBounds = new THREE.Box2(new THREE.Vector2(), new THREE.Vector2(this.width, this.height));

    public colorMap!: THREE.Texture;
    public bumpMap!: THREE.Texture;

    get detailScalar() {
        return this.width / 512;
    }

    /**
     * Assumes geometry vertices are unit-square scaled.
     */
    constructor(
        public geometry: THREE.Geometry,
        public leaf: VeinedLeaf,
        public allNodes: LeafNode[]) {
            geometry.computeBoundingBox();
            this.boundingBox = geometry.boundingBox;
    }

    public generateAndDrawMaps() {
        // this.initAndComputeCells();
        this.fillMaps();
    }

    public updateGeometryFaceVertexUvs() {
        // fill the face uvs
        const { geometry, allNodes } = this;
        const layer0 = geometry.faceVertexUvs[0];
        for (const face of geometry.faces) {
            const { a, b, c } = face;
            const faceUv = [
                this.uvPosition(allNodes[a]),
                this.uvPosition(allNodes[b]),
                this.uvPosition(allNodes[c]),
            ]
            layer0.push(faceUv);
        }
        geometry.uvsNeedUpdate = true;
    }

    // private initAndComputeCells() {
    //     this.cells = new Array(150).fill(null).map(() => new LeafCell(this));
    //     for (let iter = 0; iter < 10; iter++) {
    //         // move points away from each other
    //         for (const point of this.cells) {
    //             point.computeNextPosition(this.cells);
    //         }
    //         for (const point of this.cells) {
    //             point.updatePosition();
    //         }
    //     }
    // }

    /**
     * Returns pixel coordinates (in [0, width/height]) for the leafNode's position.
     */
    public pixelPosition(node: LeafNode) {
        const { x, y } = this.uvPosition(node);
        return new THREE.Vector2(this.width * x, this.height * (1 - y));
    }

    private tempP = new THREE.Vector3();
    /**
     * Returns uv coordinates (in [0, 1]) for the leafNode's position.
     */
    public uvPosition(node: LeafNode) {
        node.getWorldPosition(this.tempP);
        const { x: nodeX, z: nodeZ } = this.tempP;
        const u = (nodeX - this.boundingBox.min.x);
        const v = (nodeZ + 0.5);
        // if (u < 0 || u > 1 || v < 0 || v > 1) throw new Error("uv out of bounds: " + u + ", " + v);
        return new THREE.Vector2(u, v);
    }

    public fillMaps() {
        const colorCanvas = document.createElement("canvas");
        colorCanvas.width = this.width;
        colorCanvas.height = this.height;
        const bumpCanvas = document.createElement("canvas");
        bumpCanvas.width = this.width;
        bumpCanvas.height = this.height;

        const color = colorCanvas.getContext("2d")!;
        const bump = bumpCanvas.getContext("2d")!;

        color.fillStyle = "green";
        color.fillRect(0, 0, colorCanvas.width, colorCanvas.height);

        bump.fillStyle = "black";
        bump.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

        // has potential; very slow
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const b = THREE.Math.randInt(254, 255);
                bump.fillStyle = `rgb(${b}, ${b}, ${b})`;
                bump.fillRect(x, y, 1, 1);
            }
        }

        const VEIN_THICKNESS = 4.0;
        const outlineBones = (t: number) => {
            color.strokeStyle = `rgba(0, 100, 0, ${t * 5 / detailIterations})`;
            bump.strokeStyle = `rgba(235, 235, 235, ${t / detailIterations})`;
            for (const leafNode of this.allNodes) {
                const { x, y } = this.pixelPosition(leafNode);
                for (const child of leafNode.children) {
                    if (child instanceof LeafNode) {
                        // const width = VEIN_THICKNESS * Math.log(1 + child.vein.weight) * (1 - t) * this.detailScalar;
                        const width = Math.max(
                            0.2,
                            VEIN_THICKNESS * Math.log(1 + child.vein.weight) * (1 - t) * this.detailScalar / (1 + child.vein.numTurns)
                        );
                        // const width = VEIN_THICKNESS * Math.pow(child.vein.weight, 1 / 3) * (1 - t) * this.detailScalar;
                        // const width = VEIN_THICKNESS * Math.pow(child.vein.weight, 1 / 2) * (1 - t) * this.detailScalar;
                        // const width = VEIN_THICKNESS * 2 * this.detailScalar * (1 - t);
                        color.lineWidth = width;
                        bump.lineWidth = width * 1.25;
                        color.beginPath();
                        bump.beginPath();
                        const { x: px, y: py } = this.pixelPosition(child);
                        color.moveTo(x, y);
                        color.lineTo(px, py);

                        bump.moveTo(x, y);
                        bump.lineTo(px, py);
                        color.stroke();
                        bump.stroke();
                    }
                }
            }
        };

        const detailIterations = 4;
        for (let i = 1; i < detailIterations + 1; i++) {
            const t = i / detailIterations;
            outlineBones(t);
        }

        // for (const cell of this.cells) {
        //     color.beginPath();
        //     color.arc(cell.position.x, cell.position.y, 25, 0, Math.PI * 2);
        //     color.stroke();
        //     bump.beginPath();
        //     bump.arc(cell.position.x, cell.position.y, 25, 0, Math.PI * 2);
        //     bump.stroke();
        // }

        this.colorMap = new THREE.CanvasTexture(colorCanvas);
        this.bumpMap = new THREE.CanvasTexture(bumpCanvas);
        document.body.appendChild(colorCanvas);
        document.body.appendChild(bumpCanvas);
    }
}
