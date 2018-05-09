import * as THREE from "three";

import { logistic } from "../../../math";
import { Component } from "../component";
import { dna } from "../dna";
import { LeafOld } from "../leaf/leafOld";
import { LeafTemplate } from "../veinMesh/leafTemplate";
import { VeinBone, VeinedLeafSkeleton } from "../veinMesh/veinedLeafSkeleton";

export default class Petal extends Component {
    public mesh: THREE.SkinnedMesh;
    constructor(template: LeafTemplate) {
        super();
        // // can't really do this yet
        // noisyEdge: true,

        this.mesh = template.instantiateLeaf();
        this.add(this.mesh);
    }

    updateSelf(t: number) {
        const timeAlive = (t - this.timeBorn);
        // const rotZ = THREE.Math.mapLinear(THREE.Math.smoothstep(timeAlive, 0, 10000), 0, 1, 0, -Math.PI / 2);
        // this.mesh.rotation.z = rotZ;

        const rotationMult = 1 - 1 / (1 + timeAlive / 10000); // 0 to 1

        for (const boneUncast of this.mesh.skeleton.bones) {
            // HACKHACK make this based off physics instead
            const bone = boneUncast as VeinBone;
            const skeleton = this.mesh.skeleton as VeinedLeafSkeleton;
            // curl the leaves
            let { x, y: z } = bone.vein.position;
            x *= skeleton.downScalar;
            z *= skeleton.downScalar;
            const len = Math.sqrt(x * x + z * z);
            bone.rotation.z = (0.3 * len - bone.rotation.z) * rotationMult * 0.01 + Math.abs(z) * rotationMult * 0.1;

            // // TODO make the position integrate to a log(1+x) look properly
            // const t2 = Math.abs(z) * 40 - 6;
            // const pos = logistic(t2) * ( 1 - logistic(t2)) * 0.01;
            // bone.position.y = -pos;
            // // bone.rotation.y = 0.1 / (1 + Math.abs(z) * 10);
        }
    }

    static generate(template: LeafTemplate) {
        return new Petal(template);
    }
}
