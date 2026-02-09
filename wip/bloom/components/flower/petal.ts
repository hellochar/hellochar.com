import * as THREE from "three";

import { simulateVeinBoneGravity } from "../../physics";
import { season } from "../../season";
import { LeafTemplate } from "../../veinMesh/leafTemplate";
import { Component } from "../component";

const finalRotZ = THREE.Math.randFloat(Math.PI / 16, Math.PI / 2.5);
const bone0Stiffness = Math.pow(10, THREE.Math.randFloat(-1, -1.5));
const bone1Stiffness = bone0Stiffness * Math.pow(10, THREE.Math.randFloat(-1, -2));
const sideBoneMax = Math.random() * Math.random();

const scaleTimer = THREE.Math.randFloat(0.45, 0.55);
const rotStart = THREE.Math.randFloat(0.15, 0.25);
const rotDuration = THREE.Math.randFloat(0.25, 0.50);

export default class Petal extends Component {
    public mesh: THREE.SkinnedMesh;
    constructor(template: LeafTemplate) {
        super();
        this.frustumCulled = false;
        this.mesh = template.instantiateLeaf();
        this.add(this.mesh);
    }

    private scaleRand = THREE.Math.randFloat(0.98, 1.02) * scaleTimer;
    private rotRandDuration = THREE.Math.randFloat(0.98, 1.02) * rotDuration;

    updateSelf(t: number) {
        if (season.type === "growing") {
            this.mesh.scale.setScalar(0.001);
            // don't do anything yet
            return;
        }

        if (season.type === "flowering") {
            const scale = THREE.Math.smoothstep(season.percent, 0, this.scaleRand) * 0.99 + 0.01;
            this.mesh.scale.setScalar(scale);

            const rotZ = THREE.Math.mapLinear(
                THREE.Math.clamp(THREE.Math.smoothstep(season.percent, rotStart, rotStart + this.rotRandDuration), 0, 1),
                0, 1,
                -Math.PI / 6, finalRotZ,
            );
            this.mesh.rotation.z = rotZ;
        }

        const timeAlive = (t - this.timeBorn);
        let stiffnessScalar = THREE.Math.mapLinear(Math.sin(timeAlive / 10000), -1, 1, 0.5, 1.0);
        if (season.type === "dying") {
            stiffnessScalar = 0;
        }

        const [bone0, bone1, sideBone] = this.mesh.skeleton.bones;
        simulateVeinBoneGravity(bone0, bone0Stiffness * stiffnessScalar);
        simulateVeinBoneGravity(bone1, bone1Stiffness * stiffnessScalar);
        sideBone.position.y = Math.sin(timeAlive / 4000) * sideBoneMax;
    }

    static generate(template: LeafTemplate) {
        return new Petal(template);
    }
}
