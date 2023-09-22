import * as THREE from "three";

import { simulateVeinBoneGravity } from "../../physics";
import { season } from "../../season";
import { LeafTemplate } from "../../veinMesh/leafTemplate";
import { Component } from "../component";

const tepalScalar = THREE.Math.randFloat(0.5, 1.5);
const tepalFinalRotZ = THREE.Math.randFloat(0.85, 1.15) * Math.PI / 2 * 1.1;
const tepalSidePositionY = THREE.Math.randFloat(0.5, 1.5);

const sideBoneEnd = 2 + Math.random() * 2;

const tepalOpenEnd = THREE.Math.randFloat(0.3, 0.5);

export default class Tepal extends Component {

    public mesh: THREE.SkinnedMesh;
    constructor(template: LeafTemplate) {
        super();
        this.mesh = template.instantiateLeaf();
        this.add(this.mesh);
        this.mesh.scale.setScalar(tepalScalar);
    }

    updateSelf(t: number) {
        if (season.type === "growing") {
            this.mesh.scale.setScalar(0.001);
            return;
        }
        const timeAlive = t - this.timeBorn;

        let stiffness = 0;
        const bones = this.mesh.skeleton.bones;
        if (season.type === "flowering") {
            const scale = THREE.Math.smoothstep(season.percent, 0, 0.15) * 0.99 + 0.01;
            this.mesh.scale.setScalar(scale);

            const openedAmount = THREE.Math.smoothstep(season.percent, 0.12, tepalOpenEnd);
            const rotZ = THREE.Math.mapLinear(openedAmount, 0, 1, 0., tepalFinalRotZ);
            this.mesh.rotation.z = rotZ;
            const sideBone = bones[bones.length - 1];
            sideBone.position.y = THREE.Math.mapLinear(openedAmount, 0, 1, 0, sideBoneEnd) + Math.sin(timeAlive / 4000) * 0.25;
            stiffness = 0.2;
        }
        if (season.type === "dying") {
            stiffness = (1 - THREE.Math.smoothstep(season.percent, 0, 0.1)) * 0.2;
        }

        for (let i = 0; i < bones.length - 1; i++) {
            const bone = bones[i];
            simulateVeinBoneGravity(bone, stiffness);
        }
    }

    static generate(template: LeafTemplate) {
        return new Tepal(template);
    }
}
