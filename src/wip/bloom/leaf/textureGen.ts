import * as THREE from "three";

import { LeafNode, LeafSkeleton } from "./leafSkeleton";
import { SkinnedLeaf } from "./skinnedLeaf";

/* construct a texture from a mesh

1. normalize all bone points such that the total skeleton is box length 1

 */
export function generateTexture(geom: THREE.Geometry, depthLayers: LeafSkeleton["depthLayers"], allNodes: LeafNode[]) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;

    geom.computeBoundingBox();
    const boundingBox = geom.boundingBox;
    const tempP = new THREE.Vector3();
    const scale = 1 / Math.max(
        boundingBox.max.x - boundingBox.min.x,
        boundingBox.max.z - boundingBox.min.z,
    );
    const pixelPosition = (node: LeafNode) => {
        const {x, y} = uv(node);
        return new THREE.Vector2(canvas.width * x, canvas.height * y);
    }

    const uv = (node: LeafNode) => {
        node.getWorldPosition(tempP);
        const {x: nodeX, z: nodeZ} = tempP;
        const u = (nodeX + boundingBox.min.x) * scale;
        const v = (nodeZ * scale + 0.5);
        // if (u < 0 || u > 1 || v < 0 || v > 1) throw new Error("uv out of bounds: " + u + ", " + v);
        return new THREE.Vector2(u, v);
    }

    const context = canvas.getContext("2d")!;

    context.fillStyle = "green";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.lineWidth = 2;
    context.beginPath();
    context.strokeStyle = "darkgreen";

    for (const layer of depthLayers) {
        for (const node of layer) {
            const { leftNode, forwardNode, rightNode } = node;
            const {x, y} = pixelPosition(node);
            if (leftNode) {
                context.moveTo(x, y);
                const {x: px, y: py} = pixelPosition(leftNode);
                context.lineTo(px, py);
            }

            if (forwardNode) {
                context.moveTo(x, y);
                const {x: px, y: py} = pixelPosition(forwardNode);
                context.lineTo(px, py);
            }

            if (rightNode) {
                context.moveTo(x, y);
                const {x: px, y: py} = pixelPosition(rightNode);
                context.lineTo(px, py);
            }
        }
    }
    context.stroke();

    // fill the face uvs
    const layer0 = geom.faceVertexUvs[0];
    for (const face of geom.faces) {
        const {a, b, c} = face;
        const faceUv = [
            uv(allNodes[a]),
            uv(allNodes[b]),
            uv(allNodes[c]),
        ]
        layer0.push(faceUv);
    }
    geom.uvsNeedUpdate = true;

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}
