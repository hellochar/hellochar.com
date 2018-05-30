import * as THREE from "three";

import { Component } from "../component";
import { Flower } from "../flower";
import Leaves from "../leaf/leaves";
import { Branch } from "./branch";
import { BranchBone } from "./branchBone";
import { Leaf } from "../leaf";
import dna from "../dna";

export interface BranchingPattern {
    getComponentsFor(branch: BranchBone): Component[] | null;
}

export class DefaultBranchingPattern implements BranchingPattern {
    public branchLengthScalar = THREE.Math.randFloat(0.7, 0.9);
    public branchRotationZ = THREE.Math.randFloat(Math.PI / 3, Math.PI / 12);

    public BONES_PER_GROWTH = 10;

    public growthsPerRotation = 4;

    constructor() { }

    getComponentsFor(bone: BranchBone) {
        // we're at the end, grow a flower
        if (bone.children.length === 0) {
            const shouldGrowFlower = bone.branch.finalBranchLength > 1.5 && bone.getWorldPosition().y > 1.5;
            if (shouldGrowFlower) {
                const flower = Flower.generate();
                flower.position.y = bone.position.y;
                return [flower];
            } else {
                const leaf = Leaf.generate(dna.leafTemplate);
                leaf.rotateZ(Math.PI / 2);
                return [leaf];
            }
        }

        if (bone.index % this.BONES_PER_GROWTH === this.BONES_PER_GROWTH - 1) {
            // // create a leaf
            // function genLeaf(yAngle: number) {
            //     const leaf = Leaf.generate(leafTemplate);
            //     leaf.rotateY(yAngle);
            //     leaf.rotateZ(Math.PI / 4);
            //     leaf.scale.multiplyScalar(0.6);
            //     return leaf;
            // }
            // const xAngle = bone.index / BONES_PER_GROWTH * Math.PI * 2 / growthsPerRotation;
            // const leaves = [genLeaf(xAngle), genLeaf(xAngle + Math.PI)];
            const leaves = [Leaves.generate()];
            // const leaves: Component[] = [];

            const totalBones = bone.branch.meshManager.skeleton.bones.length;
            const percentDist = bone.index / totalBones;
            // console.log(percentDist);
            if (percentDist < 0.5) {
            // if (Math.random() > percentDist) {
                const newBranchLength = (1 - percentDist) * this.branchLengthScalar * bone.branch.finalBranchLength;
                if (newBranchLength >= 1) {
                    const branch = new Branch(newBranchLength);
                    branch.rotateY(Math.PI * 2 * Math.random());
                    // const randYDir = Math.random() * Math.PI * 2;
                    // TODO should we rotate bones[0]? or should we rotate the Branch itself?
                    // branch.meshManager.skeleton.bones[0].rotateZ(-Math.PI / 2);
                    branch.rotateZ(-this.branchRotationZ);
                    return [branch, ...leaves];
                }
                return leaves;
            } else {
                return leaves;
            }
        }
        return null;
    }
}
