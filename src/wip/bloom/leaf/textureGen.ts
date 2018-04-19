import Delaunator from "delaunator";
import * as THREE from "three";

import { LeafNode, LeafSkeleton } from "./leafSkeleton";
import { SkinnedLeaf } from "./skinnedLeaf";

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
    public width = 1024;
    public height = 1024;
    private boundingBox: THREE.Box3;
    private scale: number;
    private cells!: LeafCell[];
    public pixelBounds = new THREE.Box2(new THREE.Vector2(), new THREE.Vector2(this.width, this.height));

    public colorMap!: THREE.Texture;
    public bumpMap!: THREE.Texture;

    constructor(
        public geometry: THREE.Geometry,
        public depthLayers: LeafSkeleton["depthLayers"],
        public allNodes: LeafNode[]) {
        geometry.computeBoundingBox();
        this.boundingBox = geometry.boundingBox;
        this.scale = 1 / Math.max(
            this.boundingBox.max.x - this.boundingBox.min.x,
            this.boundingBox.max.z - this.boundingBox.min.z,
        );
    }

    public generateAndDrawMaps() {
        this.initAndComputeCells();
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

    private initAndComputeCells() {
        this.cells = new Array(150).fill(null).map(() => new LeafCell(this));
        for (let iter = 0; iter < 10; iter++) {
            // move points away from each other
            for (const point of this.cells) {
                point.computeNextPosition(this.cells);
            }
            for (const point of this.cells) {
                point.updatePosition();
            }
        }
    }

    /**
     * Returns pixel coordinates (in [0, width/height]) for the leafNode's position.
     */
    public pixelPosition(node: LeafNode) {
        const { x, y } = this.uvPosition(node);
        return new THREE.Vector2(this.width * x, this.height * y);
    }

    private tempP = new THREE.Vector3();
    /**
     * Returns uv coordinates (in [0, 1]) for the leafNode's position.
     */
    public uvPosition(node: LeafNode) {
        node.getWorldPosition(this.tempP);
        const { x: nodeX, z: nodeZ } = this.tempP;
        const u = (nodeX + this.boundingBox.min.x) * this.scale;
        const v = (nodeZ * this.scale + 0.5);
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

        bump.lineWidth = 0.6;
        bump.beginPath();
        bump.strokeStyle = "rgb(241, 241, 241)";
        const triangulation = Delaunator.from(this.cells, (c) => c.position.x, (c) => c.position.y);
        for (let i = 0; i < triangulation.halfedges.length; i++) {
            const vertex1 = this.cells[triangulation.triangles[i]];
            const halfEdgeIndex = triangulation.halfedges[i];
            if (halfEdgeIndex !== -1) {
                const vertex2 = this.cells[triangulation.triangles[halfEdgeIndex]];
                bump.moveTo(vertex1.position.x, vertex1.position.y);
                bump.lineTo(vertex2.position.x, vertex2.position.y);
                // for symmetry, draw another line reflected across y=512
                bump.moveTo(vertex1.position.x, this.height - vertex1.position.y);
                bump.lineTo(vertex2.position.x, this.height - vertex2.position.y);
            }

            // bump.arc(cell.position.x, cell.position.y, 25, 0, Math.PI * 2);
        }
        bump.stroke();

        const outlineBones = () => {
            color.beginPath();
            bump.beginPath();
            for (const layer of this.depthLayers) {
                for (const node of layer) {
                    const { leftNode, forwardNode, rightNode } = node;
                    const { x, y } = this.pixelPosition(node);
                    if (leftNode) {
                        const { x: px, y: py } = this.pixelPosition(leftNode);
                        color.moveTo(x, y);
                        color.lineTo(px, py);

                        bump.moveTo(x, y);
                        bump.lineTo(px, py);
                    }

                    if (forwardNode) {
                        const { x: px, y: py } = this.pixelPosition(forwardNode);
                        color.moveTo(x, y);
                        color.lineTo(px, py);

                        bump.moveTo(x, y);
                        bump.lineTo(px, py);
                    }

                    if (rightNode) {
                        const { x: px, y: py } = this.pixelPosition(rightNode);
                        color.moveTo(x, y);
                        color.lineTo(px, py);

                        bump.moveTo(x, y);
                        bump.lineTo(px, py);
                    }
                }
            }
            color.stroke();
            bump.stroke();
        };
        const detailIterations = 5;
        for (let i = 0; i <= detailIterations; i++) {
            const t = i / detailIterations;

            color.lineWidth = 4 * (1 - t);
            color.strokeStyle = `rgba(0, 100, 0, ${t})`;

            bump.lineWidth = 8 * (1 - t);
            bump.strokeStyle = `rgba(235, 235, 235, ${t})`;
            outlineBones();
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
