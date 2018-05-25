import * as THREE from "three";

import { Component } from "../component";
import { simulateVeinBoneGravity } from "../physics";
import { LeafTemplate } from "../veinMesh/leafTemplate";

export default class Tepal extends Component {

    public mesh: THREE.SkinnedMesh;
    constructor(template: LeafTemplate) {
        super();
        this.mesh = template.instantiateLeaf();
        this.add(this.mesh);
    }

    updateSelf(t: number) {
        const timeAlive = (t - this.timeBorn);
        // TODO fix rotZ for tepals
        const rotZ = THREE.Math.mapLinear(THREE.Math.smoothstep(timeAlive, 0, 10000), 0, 1, 0, Math.PI / 6);
        this.mesh.rotation.z = rotZ;

        const bones = this.mesh.skeleton.bones;
        for (let i = 0; i < bones.length - 1; i++) {
            const bone = bones[i];
            // TODO stiffness factored by time alive
            // TODO stiffness changes as a function of time
            simulateVeinBoneGravity(bone, 0.1);
        }
        const sideBone = bones[bones.length - 1];
        simulateVeinBoneGravity(sideBone, 0);
    }

    static generate(template: LeafTemplate) {
        return new Tepal(template);
    }
}
