import * as THREE from "three";

import { Component } from "../component";
import { simulateVeinBoneGravity } from "../physics";
import { LeafTemplate } from "../veinMesh/leafTemplate";

export default class Petal extends Component {
    public mesh: THREE.SkinnedMesh;
    constructor(template: LeafTemplate) {
        super();
        this.mesh = template.instantiateLeaf();
        this.add(this.mesh);
    }

    updateSelf(t: number) {
        const timeAlive = (t - this.timeBorn);
        const rotZ = THREE.Math.mapLinear(THREE.Math.smoothstep(timeAlive, 0, 10000), 0, 1, 0, Math.PI / 6);
        this.mesh.rotation.z = rotZ;

        // const rotationMult = THREE.Math.mapLinear(
        //     THREE.Math.smoothstep(timeAlive, 0, 12000), 0, 1,
        //     -1,
        //     1.1);

        const stiffnessScalar = THREE.Math.mapLinear(Math.sin(timeAlive / 10000), -1, 1, -0, 1);

        const bones = this.mesh.skeleton.bones;
        for (let i = 0; i < bones.length - 1; i++) {
            const bone = bones[i];
            // TODO stiffness factored by time alive
            // TODO stiffness changes as a function of time
            simulateVeinBoneGravity(bone, THREE.Math.mapLinear(Math.sqrt(i / (bones.length - 2)), 0, 1, 0.05, 0.001) * stiffnessScalar);
        }
        const sideBone = bones[bones.length - 1];
        simulateVeinBoneGravity(sideBone, 0);
    }

    static generate(template: LeafTemplate) {
        return new Petal(template);
    }
}
