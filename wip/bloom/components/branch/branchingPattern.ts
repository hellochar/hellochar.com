import * as THREE from "three";

import dna from "../../dna";
import { Component } from "../component";
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
    addBuds(branch: Branch): void;
}

export class DefaultBranchingPattern implements BranchingPattern {
    public branchLengthScalar = THREE.Math.randFloat(0.7, 0.9);
    public branchRotationZ = THREE.Math.mapLinear(Math.random(), 0, 1, Math.PI / 2, Math.PI / 8);

    // this *dramatically* changes growth
    public lengthPerGrowth = 0.7; // THREE.Math.randFloat(0.95, 1.05);

    public lengthPerYRotation = THREE.Math.randFloat(2, 4);

    public baseYRot = Math.random() * Math.PI * 2;

    // Ratio of leaf whorls for every new child branch (e.g. 2 = grow half as many branches).
    public growthsPerBranch = 1;

    constructor() {
        // special - if max branch depth is 1, grow twice as much and maybe grow flowers right on the tree
        if (MAX_BRANCH_DEPTH === 2) {
            this.lengthPerGrowth /= 1.3;
            this.growthsPerBranch = 2;
        }
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
        for (let length = this.lengthPerGrowth, growthCount = 0; length <= branch.finalBranchLength - this.lengthPerGrowth; length += this.lengthPerGrowth, growthCount++) {
            const boneIndex = Math.floor(length / LENGTH_PER_BONE);
            const boneStartLength = boneIndex * LENGTH_PER_BONE;
            const y = length - boneStartLength;
            const rotY = Math.PI * 2 * length / this.lengthPerYRotation + this.baseYRot;

            const curGrowthCount = growthCount;

            const bud = new Bud(() => {
                const components: Component[] = [];

                const leafWhorl = Leaves.generate();
                components.push(leafWhorl);

                const percentDist = length / branch.finalBranchLength;
                if (percentDist < 0.5 && newDepth < MAX_BRANCH_DEPTH && curGrowthCount % this.growthsPerBranch === 0) {
                    const newBranchLength = (1 - percentDist) * this.branchLengthScalar * branch.finalBranchLength;
                    if (newBranchLength >= 1) {
                        const newBranch = new Branch(newBranchLength, newDepth);
                        // put it opposite the leaf
                        newBranch.rotateY(Math.PI);
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

        if (MAX_BRANCH_DEPTH <= 2 && !(branch instanceof FlowerWhorlBranch)) {
            const num = MAX_BRANCH_DEPTH === 1 ? THREE.Math.randInt(8, 16) : THREE.Math.randInt(3, 5);
            const branchLength = MAX_BRANCH_DEPTH === 1 ? 3 : 1.5;

            lastBone.addBud(this.createFlowerWhorlBud(num, branchLength));
        } else {
            lastBone.addBud(new Bud((bud) => {
                const pos = bud.getWorldPosition(new THREE.Vector3());
                const chance = THREE.Math.mapLinear(pos.y, 0.1, 1.0, 0, 1);

                if (Math.random() < chance || branch instanceof FlowerWhorlBranch) {
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

    addBuds(branch: Branch) {
        if (!(branch instanceof FlowerWhorlBranch)) {
            this.addBudsOnSides(branch);
        }

        this.addFlowerBudAtEnd(branch);
    }

    createFlowerWhorlBud(num: number, branchLength: number) {
        return new Bud((bud) => {
            const startYRot = 0; // THREE.Math.randFloat(Math.PI / 2, Math.PI / 4);
            const endYRot = Math.PI * 2; // startYRot * 0.5;
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
                    return new FlowerWhorlBranch(branchLength, Infinity)
                },
            });
            // flowerWhorl.rotateZ(Math.PI / 2);
            return [flowerWhorl];
        });
    }
}
