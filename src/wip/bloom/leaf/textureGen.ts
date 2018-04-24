import Delaunator from "delaunator";
import * as THREE from "three";

import { VeinBone, VeinedLeafSkeleton } from "../vein/leafSkeleton";
import { VeinedLeaf } from "../vein/veinedLeaf";
import { SkinnedLeaf } from "./skinnedLeaf";

export class LeafTextureGenerator {
    public width = 2048;
    public height = 2048;
    private boundingBox: THREE.Box3;
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
        public allNodes: VeinBone[]) {
            geometry.computeBoundingBox();
            this.boundingBox = geometry.boundingBox;
    }

    public generateAndDrawMaps() {
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

    /**
     * Returns pixel coordinates (in [0, width/height]) for the leafNode's position.
     */
    public pixelPosition(node: VeinBone) {
        const { x, y } = this.uvPosition(node);
        return new THREE.Vector2(this.width * x, this.height * (1 - y));
    }

    private tempP = new THREE.Vector3();
    /**
     * Returns uv coordinates (in [0, 1]) for the leafNode's position.
     */
    public uvPosition(node: VeinBone) {
        node.getWorldPosition(this.tempP);
        const { x: nodeX, z: nodeZ } = this.tempP;
        const u = (nodeX - this.boundingBox.min.x);
        const v = (nodeZ + 0.5);
        // if (u < 0 || u > 1 || v < 0 || v > 1) throw new Error("uv out of bounds: " + u + ", " + v);
        return new THREE.Vector2(u, v);
    }

    private fillMaps() {
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
                    if (child instanceof VeinBone) {
                        // const width = VEIN_THICKNESS * Math.log(1 + child.vein.weight) * (1 - t) * this.detailScalar;
                        const width = Math.max(
                            0.2,
                            VEIN_THICKNESS * Math.log(1 + child.vein.weight) * (1 - t) * this.detailScalar / (1 + child.vein.numTurns),
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

        this.colorMap = new THREE.CanvasTexture(colorCanvas);
        this.bumpMap = new THREE.CanvasTexture(bumpCanvas);
        // document.body.appendChild(colorCanvas);
        // document.body.appendChild(bumpCanvas);
    }
}
