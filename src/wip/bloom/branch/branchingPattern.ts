import * as THREE from "three";

import { Component } from "../component";
import dna from "../dna";
import { Flower } from "../flower";
import { Leaf } from "../leaf";
import Leaves from "../leaf/leaves";
import { Branch } from "./branch";
import { LENGTH_PER_BONE } from "./branchMeshManager";
import { Bud } from "./bud";

const worldPosition = new THREE.Vector3();

export interface BranchingPattern {
    // getComponentsFor(branch: BranchBone): Component[] | null;

    addBuds(branch: Branch): void;
}

export class DefaultBranchingPattern implements BranchingPattern {
    public branchLengthScalar = THREE.Math.randFloat(0.7, 0.9);
    public branchRotationZ = THREE.Math.mapLinear(Math.random() * Math.random(), 0, 1, Math.PI / 2, Math.PI / 8);

    // this *dramatically* changes growth
    public lengthPerGrowth = 1.0;

    public lengthPerYRotation = THREE.Math.randFloat(2, 4);

    public baseYRot = Math.random() * Math.PI * 2;

    constructor() { }

    addBuds(branch: Branch) {
        // ok, so, for instance
        // 5 bones per length, final length 10 = 50 bones
        // 0.2 length per bone
        // length = 1, 2, 3, 4, 5, 6, 7, 8, 9
        // boneIndex = Math.floor(length / length_per_bone)
        // boneStartLength = boneIndex * length_per_bone
        // position.y = boneStartLength - length

        const bones = branch.meshManager.skeleton.bones;
        for (let length = this.lengthPerGrowth; length <= branch.finalBranchLength - this.lengthPerGrowth; length += this.lengthPerGrowth) {
            const boneIndex = Math.floor(length / LENGTH_PER_BONE);
            const boneStartLength = boneIndex * LENGTH_PER_BONE;
            const y = length - boneStartLength;
            const rotY = Math.PI * 2 * length / this.lengthPerYRotation + this.baseYRot;

            const bud = new Bud(() => {
                const components: Component[] = [];

                const leafWhorl = Leaves.generate();
                components.push(leafWhorl);

                const percentDist = length / branch.finalBranchLength;
                // console.log(percentDist);
                if (percentDist < 0.5) {
                    const newBranchLength = (1 - percentDist) * this.branchLengthScalar * branch.finalBranchLength;
                    if (newBranchLength >= 1) {
                        const newBranch = new Branch(newBranchLength);
                        newBranch.rotateZ(-this.branchRotationZ);
                        components.push(newBranch);
                    }
                }

                return components;
            });
            bud.rotateY(rotY);
            bud.position.y = y;
            bones[boneIndex].addBud(bud);
        }

        // add flower on last bone or leaf on last bone
        const lastBone = bones[bones.length - 1];
        lastBone.addBud(new Bud((bud) => {
            const pos = bud.getWorldPosition();
            if (pos.y > 1.5) {
                const flower = Flower.generate();
                return [flower];
            } else {
                const leaf = Leaf.generate(dna.leafTemplate);
                leaf.rotateZ(Math.PI / 2);
                return [leaf];
            }
        }));
    }
}
