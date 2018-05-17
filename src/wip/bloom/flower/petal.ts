import * as THREE from "three";

import { logistic } from "../../../math";
import { Component } from "../component";
import { dna } from "../dna";
import { LeafOld } from "../leaf/leafOld";
import { LeafTemplate } from "../veinMesh/leafTemplate";
import { VeinedLeafSkeleton } from "../veinMesh/veinedLeafSkeleton";

export default class Petal extends Component {
    public mesh: THREE.SkinnedMesh;
    constructor(template: LeafTemplate) {
        super();
        this.mesh = template.instantiateLeaf();
        this.add(this.mesh);
    }

    updateSelf(t: number) {
        const timeAlive = (t - this.timeBorn);
        const rotZ = THREE.Math.mapLinear(THREE.Math.smoothstep(timeAlive, 0, 10000), 0, 1, -Math.PI / 2, -Math.PI / 6);
        this.mesh.rotation.z = rotZ;

        const rotationMult = THREE.Math.mapLinear(
            THREE.Math.smoothstep(timeAlive, 0, 12000), 0, 1,
            -1,
            1.1);

        // const [base, forward, ortho, forwardCurl, sideCurl] = this.mesh.skeleton.bones;
        const [base, ...bones] = this.mesh.skeleton.bones;
        // rotation does some weird shit
        // forward.rotation.z += 0.01;

        // base.rotation.z += 0.01;

        // total rotation = NUM_BONES * rotationPerBone
        // rotationPerBone = rotation / NUM_BONES
        const NUM_BONES = 2;
        const wantedRotation = Math.PI / 2;
        for (const bone of bones) {
            bone.rotation.z = rotationMult * wantedRotation / NUM_BONES;
        }

        // forward.rotation.z = Math.sin(timeAlive / 1000) * Math.PI;

        // forward.position.x = 1;
        // forward.position.y = Math.sin(timeAlive / 4000) * 1;
        // // forward.position.z = Math.sin(timeAlive / 2000) * 0.2;
        // forward.position.normalize();

        // ortho.position.z = 1;
        // ortho.position.y = Math.sin(timeAlive / 5000) * 1;
        // ortho.position.normalize();

        // forwardCurl.position.x = 1;
        // forwardCurl.position.y = Math.sin(timeAlive / 1000) * 1;
        // forwardCurl.position.setLength(0.1);

        // forwardCurl.rotation.z += 0.1;

        // forwardCurl.position.setFromSpherical(new THREE.Spherical(0.1, 0, timeAlive / 1000));
    }

    static generate(template: LeafTemplate) {
        return new Petal(template);
    }
}
