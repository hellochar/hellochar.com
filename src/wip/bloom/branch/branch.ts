import * as THREE from "three";

import { Component } from "../component";
import { Flower } from "../flower";
import Leaves from "../leaf/leaves";
// import { BranchGrowthManager } from "./branchGrowthManager";
import { BONES_PER_UNIT_LENGTH, BranchMeshManager } from "./branchMeshManager";

// nutrients per second
export const NUTRIENT_PER_SECOND = 1;

export class Branch extends Component {
    meshManager: BranchMeshManager;
    // growthManager: BranchGrowthManager;

    public constructor(public finalBranchLength: number) {
        super();
        this.meshManager = new BranchMeshManager(this);
        this.add(this.meshManager.mesh);
        // this.growthManager = new BranchGrowthManager(this, this.meshManager.skeleton);
    }

    /**
     * Time it'll take this branch to grow to maturity. Maturity is defined
     * as when all the branch bones are at 100% growth.
     */
    public getEstimatedSecondsToMaturity() {
        // x = v*t; v = BRANCH_GROWTH_FACTOR, x = finalBranchLength * BONES_PER_UNIT_LENGTH
        // t = x / v
        return this.finalBranchLength * BONES_PER_UNIT_LENGTH / NUTRIENT_PER_SECOND;
    }

    public computeMaturityAmount() {
        const bones = this.meshManager.skeleton.bones;
        let totalGrowthPercentage = 0;
        for (const b of bones) {
            totalGrowthPercentage += b.getGrowthPercentage();
        }
        return totalGrowthPercentage / this.meshManager.skeleton.bones.length;
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

    private lastT: number = -1;
    updateSelf(t: number) {
        if (this.lastT < 0) {
            this.lastT = t - 16 / 1000; // just fake it
        }
        const timeAlive = t - this.timeBorn;
        const { bones } = this.meshManager.skeleton;
        const deltaMs = t - this.lastT;
        const nutrientsGiven = NUTRIENT_PER_SECOND / 1000 * deltaMs;
        bones[0].feed(t, nutrientsGiven);

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
        this.lastT = t;
    }

    static generate() {
        return new Branch(10);
    }
}
