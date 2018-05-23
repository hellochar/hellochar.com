import * as THREE from "three";

import { Component } from "../component";
import { Flower } from "../flower";
import Leaves from "../leaf/leaves";
// import { BranchGrowthManager } from "./branchGrowthManager";
import { BranchMeshManager } from "./branchMeshManager";

export class Branch extends Component {
    meshManager: BranchMeshManager;
    // growthManager: BranchGrowthManager;

    public constructor(public finalBranchLength: number) {
        super();
        this.meshManager = new BranchMeshManager(this);
        this.add(this.meshManager.mesh);
        // this.growthManager = new BranchGrowthManager(this, this.meshManager.skeleton);
    }

    private createBranch(newBranchLength: number) {
        const branch = new Branch(newBranchLength);
        const randYDir = Math.random() * Math.PI * 2;
        // TODO should we rotate bones[0]? or should we rotate the Branch itself?
        branch.meshManager.skeleton.bones[0].rotateZ(-Math.PI / 2);
        return branch;
    }

    private addChildAtPoint(child: Component, bone: THREE.Bone) {
        // where do I add it? How do I ensure it continues on the skeleton?
        // 1) add to me, set position and rotation manually
        // 2) maybe add to Bone as a child?
        // this.add(child);
        child.rotateY(Math.PI * 2 * Math.random());
        bone.add(child);

        // const childPosition = bone.getWorldPosition().sub(this.getWorldPosition());
        // child.position.copy(childPosition);

        // const childScale = bone.getWorldScale();
        // // child.skeleton.bones[0].scale.copy(childScale);
        // child.scale.copy(childScale);
        // child.scale.multiplyScalar(0.5);
        // this.add(child);
    }

    updateSelf(t: number) {
        const timeAlive = t - this.timeBorn;
        const { bones } = this.meshManager.skeleton;
        const growthFactor = 16 / 1000;
        bones[0].feed(t, growthFactor);

        const bonesPerGrowth = 10;

        // grow branches
        // let endIndex = bones.findIndex((b) => b.scale.x < boneShrinkFactor);
        // if (endIndex === -1) {
        //     endIndex = bones.length - 1;
        // }

        // const currentBone = bones[endIndex];
        // if (endIndex !== bones.length - 1) {
        //     const scale = currentBone.scale.x;
        //     const newScale = Math.min(boneShrinkFactor, scale + growthFactor);
        //     currentBone.scale.set(newScale, newScale, newScale);
        //     // currentBone.rotation.z += 0.1 * Math.sin(t / 700);

        // } else if (this.flower == null) {
        //     // we've grown all the way! grow a flower at the end.
        //     const flower = this.flower = this.createFlower();
        //     this.addChildAtPoint(this.flower, currentBone);
        // }

        // grow another thing here
        // if (endIndex % bonesPerGrowth === (bonesPerGrowth - 1) && currentBone.scale.x >= boneShrinkFactor) {
        //     const currentLength = THREE.Math.mapLinear(endIndex, 0, bones.length, 0, this.finalBranchLength);
        //     const newBranchLength = this.finalBranchLength - currentLength;
        //     if (newBranchLength > 1) {
        //         const height = currentBone.getWorldPosition().y;
        //         const growthPercentage = currentLength / this.finalBranchLength;
        //         if (Math.random() > growthPercentage) {
        //             const branch = this.createBranch(newBranchLength);
        //             this.addChildAtPoint(branch, currentBone);
        //             branch.scale.multiplyScalar(0.8);
        //         }
        //         const leaves = Leaves.generate();
        //         this.addChildAtPoint(leaves, currentBone);
        //         leaves.scale.multiplyScalar(0.7);
        //     }
        // }

        // for (let i = 0; i < endIndex; i++) {
        //     const bone = bones[i];
        //     // bone.rotation.y += 0.001;
        //     function wobble() {
        //         const wobbleAmount = THREE.Math.clamp(
        //             THREE.Math.mapLinear(i, endIndex - 10, endIndex, 0, 1),
        //             0,
        //             1,
        //         );
        //         // const wobbleAmount = Math.pow(i / endIndex, 3);
        //         // const wobbleAmount = i / endIndex;
        //         // bone.rotation.z = 0.008 * wobbleAmount * Math.sin(t / 5000);
        //         bone.rotation.x = 0.003 * wobbleAmount * Math.cos(t / 5000);
        //     }
        //     wobble();

        //     // bone.rotation.x = 0.02 * Math.sin((t - this.timeBorn) / 200);
        //     // bone.rotation.z += 0.001;

        //     function randomizeRotation() {
        //         bone.rotation.x += (Math.random() - 0.5) * 0.01;
        //         bone.rotation.y += (Math.random() - 0.5) * 0.01;
        //         bone.rotation.z += (Math.random() - 0.5) * 0.01;
        //     }

        //     function reachTowardsUp(moveAbility: number) {
        //         // TODO this is taxing on performance maybe?
        //         const q = bone.getWorldQuaternion();
        //         // console.log(bone.getWorldRotation());
        //         // this is up because the default of the geometry (with absolutely no rotation of any sort) is facing up
        //         const upQuarternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
        //         q.slerp(upQuarternion, 1 + moveAbility);
        //         bone.quaternion.multiply(q);
        //     }
        //     // const weight = endIndex - i;
        //     // reachTowardsUp(0.02 / (weight * weight));
        // }
    }

    static generate() {
        return new Branch(10);
    }
}
