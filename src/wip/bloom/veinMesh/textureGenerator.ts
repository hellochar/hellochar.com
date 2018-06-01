import * as THREE from "three";

import { Vein, ReasonStopped } from "../vein/vein";
import { VeinedLeaf } from "../vein/veinedLeaf";

export interface TextureGeneratorParameters {
    innerColor: THREE.Color;
    outerColor: THREE.Color;
    veinColor: THREE.Color;
    veinAlpha: number;

    bumpNoiseHeight: number;
    bumpVeinAlpha: number;
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

    static whiteNoiseImage = new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.src = "/assets/sketches/whiteNoise.png";
        image.onload = () => resolve(image);
        image.onerror = (err) => reject(err);
    });

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

        bump.fillStyle = "white";
        bump.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

        if (parameters.bumpNoiseHeight > 0) {
            TextureGenerator.whiteNoiseImage.then((img) => {
                bump.globalAlpha = parameters.bumpNoiseHeight / 255;
                for (let i = 1; i <= 8; i *= 2) {
                    bump.drawImage(img, 0, 0, bumpCanvas.width * i, bumpCanvas.height * i);
                }
                bump.globalAlpha = 1;
                this.bumpMap.needsUpdate = true;
            });
        }

        const VEIN_THICKNESS = 4.0;
        const drawVein = (t: number, x: number, y: number, child: Vein, parent: Vein) => {
            // const width = VEIN_THICKNESS * Math.log(1 + child.vein.weight) * (1 - t) * this.detailScalar;
            const width = Math.max(
                0.2,
                VEIN_THICKNESS * Math.log(1 + child.weight) * (1 - t) * this.detailScalar / (1 + child.numTurns),
            );
            // const width = VEIN_THICKNESS * Math.pow(child.vein.weight, 1 / 3) * (1 - t) * this.detailScalar;
            // const width = VEIN_THICKNESS * Math.pow(child.vein.weight, 1 / 2) * (1 - t) * this.detailScalar;
            // const width = VEIN_THICKNESS * 2 * this.detailScalar * (1 - t);

            color.lineWidth = width;
            bump.lineWidth = width * 5.5;
            color.beginPath();
            bump.beginPath();
            const parentPos = this.pixelPosition(parent);
            const childPos = this.pixelPosition(child);
            color.moveTo(parentPos.x, parentPos.y);
            color.quadraticCurveTo(x, y, childPos.x, childPos.y);

            bump.moveTo(parentPos.x, parentPos.y);
            bump.quadraticCurveTo(x, y, childPos.x, childPos.y);
            color.stroke();
            bump.stroke();
        };
        const outlineVeins = (t: number) => {
            const { r, g, b } = parameters.veinColor;
            color.strokeStyle = `rgba(${r}, ${g}, ${b}, ${t * 5 / detailIterations * parameters.veinAlpha})`;
            bump.strokeStyle = `rgba(235, 235, 235, ${t / detailIterations * parameters.bumpVeinAlpha})`;
            for (const leafNode of this.leaf.world) {
                const parent = leafNode.parent;
                if (parent != null) {
                    const { x, y } = this.pixelPosition(leafNode);
                    for (const child of leafNode.children) {
                        drawVein(t, x, y, child, parent);
                    }
                    if (leafNode.nearestNeighbor != null && leafNode.reason === ReasonStopped.Crowded) {
                        if (leafNode.nearestNeighbor.parent != parent) {
                            drawVein(t, x, y, leafNode.nearestNeighbor, parent);
                        }
                    }
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
