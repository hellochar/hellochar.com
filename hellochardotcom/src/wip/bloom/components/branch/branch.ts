import dna from "../../dna";
import { Component } from "../component";
import { BONES_PER_UNIT_LENGTH, BranchMeshManager } from "./branchMeshManager";

// TODO move this to the base, and feed nutrients from the root, and allow feeding in generic Components
export let NUTRIENT_PER_SECOND = {
    value: 5.17,
};

export class Branch extends Component {
    meshManager: BranchMeshManager;

    public constructor(public finalBranchLength: number, public depth: number) {
        super();
        this.meshManager = new BranchMeshManager(this);
        this.add(this.meshManager.mesh);
        dna.branchingPattern.addBuds(this);
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

export class FlowerWhorlBranch extends Branch {
    constructor(finalBranchLength: number, depth: number) {
        super(finalBranchLength, depth);
        for (const bone of this.meshManager.skeleton.bones) {
            bone.curveUpwardAmountBase *= 3;
        }
    }
}
