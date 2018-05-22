import * as THREE from "three";

import { logistic } from "../../../math";
import { Component } from "../component";
import { dna } from "../dna";
import { LeafOld } from "../leaf/leafOld";
import { LeafTemplate } from "../veinMesh/leafTemplate";
import { VeinedLeafSkeleton } from "../veinMesh/veinedLeafSkeleton";
import { mouse } from "../mouse";

export default class Petal extends Component {
    public mesh: THREE.SkinnedMesh;
    constructor(template: LeafTemplate) {
        super();
        this.mesh = template.instantiateLeaf();
        this.add(this.mesh);
    }

    updateSelf(t: number) {
        // const timeAlive = (t - this.timeBorn);
        // const rotZ = THREE.Math.mapLinear(THREE.Math.smoothstep(timeAlive, 0, 10000), 0, 1, -Math.PI / 2, -Math.PI / 6);
        // this.mesh.rotation.z = rotZ;

        // const rotationMult = THREE.Math.mapLinear(
        //     THREE.Math.smoothstep(timeAlive, 0, 12000), 0, 1,
        //     -1,
        //     1.1);

        // const [base, forward, ortho, forwardCurl, sideCurl] = this.mesh.skeleton.bones;
        const [base, ...bones] = this.mesh.skeleton.bones;

        // total rotation = NUM_BONES * rotationPerBone
        // rotationPerBone = rotation / NUM_BONES
        const NUM_BONES = 5;
        // const wantedRotation = Math.PI / 2;
        const quaternion = new THREE.Quaternion();

        for (const bone of bones) {
            // first, get my +x's world facing
            // then, apply gravity to it
            // put it back in my local space. it will likely now have some sort of x, y, and z offset.
            // extract the euler rotations from that xyz offset
            //

            // const currentRotation = bone.rotation.z;
            bone.getWorldQuaternion( quaternion );
            // e.g. we're at [1, 0, 0]
            const worldFacing = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
            worldFacing.y -= 0.002;
            worldFacing.normalize();
            // we're now at [0.981, -.196, 0]

            quaternion.inverse();
            const localFacing = worldFacing.applyQuaternion(quaternion);
            console.log(localFacing);
            // lets say we're at [0.717, -0.717, 0].
            // This is 45 degrees down, so we'd want to correspondingly rotate the quaternion by rotateZ(PI/4)
            // to bring it back up to 1, 0, 0.

            // reuse quaternion to compute that rotation
            quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), localFacing);
            console.log(quaternion);

            // easy enough, now apply that rotation onto the bone's rotation
            bone.quaternion.multiply(quaternion);

            // stop the .rotation from being the source of truth, and just set the quaternion directly.
            // bone.matrixAutoUpdate = false;
            // bone.matrixWorldNeedsUpdate = true;

            // bone.rotation.x = 0.2;
            // bone.rotation.y = 0.2;

            // bone.rotation.z = rotationMult * wantedRotation / NUM_BONES;
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
