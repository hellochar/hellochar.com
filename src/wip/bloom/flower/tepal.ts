import * as THREE from "three";

import { Component } from "../component";
import { simulateVeinBoneGravity } from "../physics";
import { LeafTemplate } from "../veinMesh/leafTemplate";

const tepalScalar = THREE.Math.randFloat(0.5, 1);
const tepalFinalRotZ = THREE.Math.randFloat(0.85, 1.15) * Math.PI / 2;
const tepalSidePositionY = THREE.Math.randFloat(0.5, 1.5);

export default class Tepal extends Component {

    public mesh: THREE.SkinnedMesh;
    constructor(template: LeafTemplate) {
        super();
        this.mesh = template.instantiateLeaf();
        this.add(this.mesh);
        this.mesh.scale.setScalar(tepalScalar);
    }

    updateSelf(t: number) {
        const timeAlive = (t - this.timeBorn);
        const rotZ = THREE.Math.mapLinear(THREE.Math.smoothstep(timeAlive, 0, 10000), 0, 1, 0., tepalFinalRotZ);
        this.mesh.rotation.z = rotZ;

        const bones = this.mesh.skeleton.bones;
        for (let i = 0; i < bones.length - 1; i++) {
            const bone = bones[i];
            simulateVeinBoneGravity(bone, 0.5);
        }
        const sideBone = bones[bones.length - 1];
        sideBone.position.y = tepalSidePositionY + Math.sin(timeAlive / 4000) * 0.25;
    }

    static generate(template: LeafTemplate) {
        return new Tepal(template);
    }
}
