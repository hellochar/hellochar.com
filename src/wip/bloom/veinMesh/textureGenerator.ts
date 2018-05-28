import Delaunator from "delaunator";
import * as THREE from "three";

import { VeinedLeaf } from "../vein/veinedLeaf";
import { Vein } from "../vein/vein";

export interface TextureGeneratorParameters {
    innerColor: THREE.Color;
    outerColor: THREE.Color;
    veinColor: THREE.Color;
    veinAlpha: number;

    bumpNoiseHeight: number;
    baseMaterialParams?: THREE.MeshStandardMaterialParameters;
}

/**
 * Procedurally draws a textures for a VeinedLeaf to use in THREE.js materials.
 */
export class TextureGenerator {
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
    constructor(public geometry: THREE.Geometry, public leaf: VeinedLeaf) {
        geometry.computeBoundingBox();
        this.boundingBox = geometry.boundingBox;
    }

    public generateAndDrawMaps(parameters: TextureGeneratorParameters) {
        this.fillMaps(parameters);
    }

    public updateGeometryFaceVertexUvs() {
        // fill the face uvs
        const { geometry, leaf } = this;
        const layer0 = geometry.faceVertexUvs[0];
        for (const face of geometry.faces) {
            const { a, b, c } = face;
            const faceUv = [
                this.uvPosition(leaf.world[a]),
                this.uvPosition(leaf.world[b]),
                this.uvPosition(leaf.world[c]),
            ]
            layer0.push(faceUv);
        }
        geometry.uvsNeedUpdate = true;
    }

    /**
     * Returns pixel coordinates (in [0, width/height]) for the leafNode's position.
     */
    public pixelPosition(vein: Vein) {
        const { x, y } = this.uvPosition(vein);
        return new THREE.Vector2(this.width * x, this.height * (1 - y));
    }

    private tempP = new THREE.Vector3();
    /**
     * Returns uv coordinates (in [0, 1]) for the leafNode's position.
     */
    public uvPosition(vein: Vein) {
        const { x: nodeX, y: nodeZ } = vein.normalizedPosition;
        const u = nodeX;
        const v = (nodeZ + 0.5);
        // if (u < 0 || u > 1 || v < 0 || v > 1) throw new Error("uv out of bounds: " + u + ", " + v);
        return new THREE.Vector2(u, v);
    }

    private fillMaps(parameters: TextureGeneratorParameters) {
        const colorCanvas = document.createElement("canvas");
        colorCanvas.width = this.width;
        colorCanvas.height = this.height;
        const bumpCanvas = document.createElement("canvas");
        bumpCanvas.width = this.width;
        bumpCanvas.height = this.height;

        const color = colorCanvas.getContext("2d")!;
        const bump = bumpCanvas.getContext("2d")!;

        const gradient = color.createLinearGradient(0, 0, this.width, 0);
        gradient.addColorStop(0, parameters.innerColor.getStyle());
        gradient.addColorStop(1, parameters.outerColor.getStyle());
        color.fillStyle = gradient;
        color.fillRect(0, 0, colorCanvas.width, colorCanvas.height);

        bump.fillStyle = "black";
        bump.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

        // TODO improve this, it's very slow
        // if (parameters.bumpNoiseHeight > 0) {
        //     for (let x = 0; x < this.width; x++) {
        //         for (let y = 0; y < this.height; y++) {
        //             const b = THREE.Math.randInt(255 - parameters.bumpNoiseHeight, 255);
        //             bump.fillStyle = `rgb(${b}, ${b}, ${b})`;
        //             bump.fillRect(x, y, 1, 1);
        //         }
        //     }
        // }

        const VEIN_THICKNESS = 4.0;
        const outlineVeins = (t: number) => {
            const { r, g, b } = parameters.veinColor;
            color.strokeStyle = `rgba(${r}, ${g}, ${b}, ${t * 5 / detailIterations * parameters.veinAlpha})`;
            bump.strokeStyle = `rgba(235, 235, 235, ${t / detailIterations})`;
            for (const leafNode of this.leaf.world) {
                const { x, y } = this.pixelPosition(leafNode);
                for (const child of leafNode.children) {
                    // const width = VEIN_THICKNESS * Math.log(1 + child.vein.weight) * (1 - t) * this.detailScalar;
                    const width = Math.max(
                        0.2,
                        VEIN_THICKNESS * Math.log(1 + child.weight) * (1 - t) * this.detailScalar / (1 + child.numTurns),
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
        };

        const detailIterations = 4;
        for (let i = 1; i < detailIterations + 1; i++) {
            const t = i / detailIterations;
            outlineVeins(t);
        }

        this.colorMap = new THREE.CanvasTexture(colorCanvas);
        this.bumpMap = new THREE.CanvasTexture(bumpCanvas);
        // document.body.appendChild(colorCanvas);
        // document.body.appendChild(bumpCanvas);
    }
}
