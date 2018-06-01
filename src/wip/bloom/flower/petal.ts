import * as THREE from "three";

import { Component } from "../component";
import { simulateVeinBoneGravity } from "../physics";
import { LeafTemplate } from "../veinMesh/leafTemplate";

const finalRotZ = THREE.Math.randFloat(0, Math.PI / 3);
const bone0Stiffness = Math.pow(10, THREE.Math.randFloat(-1, -1.5));
const bone1Stiffness = bone0Stiffness * Math.pow(10, THREE.Math.randFloat(-1, -2));
const sideBoneMax = Math.random() * Math.random();

export default class Petal extends Component {
    public mesh: THREE.SkinnedMesh;
    constructor(template: LeafTemplate) {
        super();
        this.mesh = template.instantiateLeaf();
        this.add(this.mesh);
    }

    updateSelf(t: number) {
        const timeAlive = (t - this.timeBorn);
        const scale = THREE.Math.smoothstep(timeAlive, 0, 20000) * 0.99 + 0.01;
        this.mesh.scale.setScalar(scale);

        const rotZ = THREE.Math.mapLinear(
            THREE.Math.clamp(THREE.Math.smoothstep(timeAlive, 10000, 40000), 0, 1),
            0, 1,
            0, finalRotZ,
        );
        this.mesh.rotation.z = rotZ;

        const stiffnessScalar = THREE.Math.mapLinear(Math.sin(timeAlive / 10000), -1, 1, 0.8, 1.2);

        const [bone0, bone1, sideBone] = this.mesh.skeleton.bones;
        simulateVeinBoneGravity(bone0, bone0Stiffness * stiffnessScalar);
        simulateVeinBoneGravity(bone1, bone1Stiffness * stiffnessScalar);
        sideBone.position.y = Math.sin(timeAlive / 4000) * sideBoneMax;
    }

    static generate(template: LeafTemplate) {
        return new Petal(template);
    }
}
