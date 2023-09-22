import { BranchingPattern } from "../components/branch/branchingPattern";
import { Petal, Stamen, Tepal } from "../components/flower";
import { Leaf } from "../components/leaf";
import { WhorlParameters } from "../components/whorl";
import { LeafTemplate } from "../veinMesh/leafTemplate";

export interface DNA {
    leafTemplate: LeafTemplate;
    petalTemplate: LeafTemplate;
    tepalTemplate: LeafTemplate;
    leafWhorlTemplate: WhorlParameters<Leaf>;
    petalWhorlTemplate: WhorlParameters<Petal>;
    tepalWhorl: WhorlParameters<Tepal>;
    branchingPattern: BranchingPattern;
    branchTemplate: BranchTemplate;
    growth: GrowthParameters;
    stamenWhorl: WhorlParameters<Stamen>;
}

export interface BranchTemplate {
    /**
     * 0.03 is a good number. How thick the branch is at full maturity
     */
    fullMaturityThickness: number;
    material: THREE.MeshLambertMaterial;
}

export interface GrowthParameters {
    /**
     * [1, 1.1] - largely determines the shape of the branch - how curvy it is.
     * we should rethink this. this is very sensitive to initial feed rate
     * and length of branch (number of simulation steps taken).
     * we should scale it based on time, or just give every segment a "target"
     * they go towards (I like this the best).
     */
    boneCurveUpwardsFactor: number;
    /**
     * [0, 1].
     * At this much growthPercentage, the bud triggers to try and grow into a real Component.
     */
    budDevelopmentThreshold: number;

    /**
     * [0, 1]. Downscale children by this size.
     */
    childScalar: number;

    /**
     * When first growing, take this percentage of the available nutrients for myself.
     * This influences how "simultaneous" the growth of multiple branches is.
     */
    feedSelfMax: number;

    zCurlFactor: number;
}
