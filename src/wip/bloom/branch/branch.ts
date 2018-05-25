import * as THREE from "three";

import { Component } from "../component";
import { Flower } from "../flower";
import Leaves from "../leaf/leaves";
import { BONES_PER_UNIT_LENGTH, BranchMeshManager } from "./branchMeshManager";

// TODO move this to the base, and feed nutrients from the root, and allow feeding in generic Components
export let NUTRIENT_PER_SECOND = {
    value: 0.2,
};

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
        return this.finalBranchLength * BONES_PER_UNIT_LENGTH / NUTRIENT_PER_SECOND.value;
    }

    public computeMaturityAmount() {
        const bones = this.meshManager.skeleton.bones;
        let totalGrowthPercentage = 0;
        for (const b of bones) {
            totalGrowthPercentage += b.getGrowthPercentage();
        }
        return totalGrowthPercentage / this.meshManager.skeleton.bones.length;
    }

    private lastT: number = -1;
    updateSelf(t: number) {
        if (this.lastT < 0) {
            this.lastT = t - 16 / 1000; // just fake it
        }

        const timeAlive = t - this.timeBorn;
        const { bones } = this.meshManager.skeleton;
        const deltaMs = t - this.lastT;
        const nutrientsGiven = NUTRIENT_PER_SECOND.value / 1000 * deltaMs;
        bones[0].feed(t, nutrientsGiven);

        this.lastT = t;
    }
}
