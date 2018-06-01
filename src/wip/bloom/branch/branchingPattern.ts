import * as THREE from "three";

import { Component } from "../component";
import dna from "../dna";
import { Flower } from "../flower";
import { Leaf } from "../leaf";
import Leaves from "../leaf/leaves";
import { Whorl } from "../whorl";
import { Branch, FlowerWhorlBranch } from "./branch";
import { LENGTH_PER_BONE } from "./branchMeshManager";
import { Bud } from "./bud";

const worldPosition = new THREE.Vector3();

let MAX_BRANCH_DEPTH = 8 / THREE.Math.randInt(1, 2) / THREE.Math.randInt(1, 2);
if (MAX_BRANCH_DEPTH === 2 && Math.random() < 0.2) {
    MAX_BRANCH_DEPTH = 1;
}

export interface BranchingPattern {
    // getComponentsFor(branch: BranchBone): Component[] | null;

    addBuds(branch: Branch): void;
}

export class DefaultBranchingPattern implements BranchingPattern {
    public branchLengthScalar = THREE.Math.randFloat(0.7, 0.9);
    public branchRotationZ = THREE.Math.mapLinear(Math.random() * Math.random(), 0, 1, Math.PI / 2, Math.PI / 8);

    // this *dramatically* changes growth
    public lengthPerGrowth = THREE.Math.randFloat(0.95, 1.05);

    public lengthPerYRotation = THREE.Math.randFloat(2, 4);

    public baseYRot = Math.random() * Math.PI * 2;

    constructor() {
        // special - if max branch depth is 1, grow twice as much and maybe grow flowers right on the tree
        if (MAX_BRANCH_DEPTH === 1) {
            this.lengthPerGrowth /= 3;
        }
    }

    addBudsOnSides(branch: Branch) {
        // ok, so, for instance
        // 5 bones per length, final length 10 = 50 bones
        // 0.2 length per bone
        // length = 1, 2, 3, 4, 5, 6, 7, 8, 9
        // boneIndex = Math.floor(length / length_per_bone)
        // boneStartLength = boneIndex * length_per_bone
        // position.y = boneStartLength - length

        const newDepth = branch.depth + 1;
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
                if (percentDist < 0.5 && newDepth < MAX_BRANCH_DEPTH) {
                    const newBranchLength = (1 - percentDist) * this.branchLengthScalar * branch.finalBranchLength;
                    if (newBranchLength >= 1) {
                        const newBranch = new Branch(newBranchLength, newDepth);
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
    }

    addFlowerBudAtEnd(branch: Branch) {
        const bones = branch.meshManager.skeleton.bones;
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

    addBuds(branch: Branch) {
        if (!(branch instanceof FlowerWhorlBranch)) {
            this.addBudsOnSides(branch);

            // add a whorl of flowers at the end
            if (MAX_BRANCH_DEPTH === 1) {
                const newDepth = branch.depth + 1;
                const bones = branch.meshManager.skeleton.bones;
                bones[bones.length - 2].addBud(new Bud((bud) => {
                    const startYRot = 0; // THREE.Math.randFloat(Math.PI / 2, Math.PI / 4);
                    const endYRot = Math.PI * 2; // startYRot * 0.5;
                    const num = THREE.Math.randInt(3, 9);
                    const flowerWhorl = Whorl.generate({
                        num,
                        startZRot: -Math.PI / 4,
                        endZRot: -Math.PI / 2,
                        startYRot,
                        endYRot,
                        endScale: 0.8,
                        startScale: 1,
                        isBilateral: true,
                        generate: () => {
                            return new FlowerWhorlBranch(2, newDepth)
                        },
                    });
                    // flowerWhorl.rotateZ(Math.PI / 2);
                    return [flowerWhorl];
                }));
            }
        }

        this.addFlowerBudAtEnd(branch);
    }
}
