import * as THREE from "three";

import { MOVEMENT_KEYS } from "./keymap";

const fontMeshGeometry = new THREE.PlaneGeometry(1, 1);
fontMeshGeometry.rotateX(Math.PI);
function createFontMesh(char: string) {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d")!;

    context.font = `${size * 0.5}px monospace`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "white";
    context.fillText(char, size / 2, size / 2);
    // context.strokeStyle = "black";
    // context.strokeText(char, size / 2, size / 2);

    const texture = new THREE.CanvasTexture(canvas);
    // texture.magFilter = THREE.NearestFilter;
    texture.flipY = true;

    const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(
        fontMeshGeometry,
        mat,
    );
    return mesh;
}
export const MOVEMENT_KEY_MESHES: Map<string, THREE.Mesh> = new Map();
for (const char in MOVEMENT_KEYS) {
    MOVEMENT_KEY_MESHES.set(char, createFontMesh(char));
}
