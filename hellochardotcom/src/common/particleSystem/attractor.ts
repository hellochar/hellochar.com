import * as THREE from "three";
import lazy from "../../common/lazy";

export type HandMesh = THREE.Object3D & {
    [childId: string]: THREE.Line | THREE.Mesh;
};

const attractorGeometry = lazy(() => new THREE.RingGeometry(15, 18, 32));
const attractorMaterialSolid = lazy(() => new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: 0xadd6b6,
    transparent: true,
    opacity: 0.6,
}));

export interface Attractor {
    x: number;
    y: number;
    handMesh?: HandMesh;
    mesh: THREE.Object3D;
    power: number;
}

export function makeAttractor(x = 0, y = 0, power = 0): Attractor {
    const mesh = new THREE.Object3D();
    mesh.position.set(x, y, -100);
    for (let i = 0; i < 10; i++) {
        // var ring = THREE.SceneUtils.createMultiMaterialObject(attractorGeometry, [attractorMaterialSolid, attractorMaterialStroke]);
        const ring = new THREE.Mesh(attractorGeometry(), attractorMaterialSolid());
        const scale = 1 + Math.pow(i / 10, 2) * 2;
        ring.scale.set(scale, scale, scale);
        mesh.add(ring);
    }
    mesh.visible = false;

    return {
        x,
        y,
        handMesh: undefined,
        mesh,
        power,
    };
}
