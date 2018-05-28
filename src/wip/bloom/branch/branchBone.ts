import * as THREE from "three";

import { Component } from "../component";
import dna from "../dna";
import { Branch } from "./branch";

// Makes a huge deal as to the final shape, since
// the apex flower will be scaled by MAX_GROWTH_SCALE^(number of bones)
// with branch length 6 and 10 bones/length we get 0.95^61 = 0.04
// this affects how much we have to globally scale the flowers!
const MAX_GROWTH_SCALE = 0.96;

const q = new THREE.Quaternion();
const dummyPosition = new THREE.Vector3();
const dummyScale = new THREE.Vector3();
/**
 * Straight up is the identity for branch bones since their initial pose is straight up
 */
const QUATERNION_UP = new THREE.Quaternion();

/**
 * A BranchBone is basically a THREE.Bone but with extra methods that provide an API surface
 * for dealing with it in model space. It has the following methods:
 *
 * Each branch has a "growth percentage" in [0, 1] that determines how "done" this branch is.
 *
 * a) feed(n) - give this branch some amount of nutrients. There's some mapping from nutrients
 *    to growth percentage. The branch can choose to consume the nutrients, or feed it to its children in
 *    any distribution.
 *
 * The BranchBone will update its THREE position/rotation/scale accordingly.
 */
export class BranchBone extends THREE.Bone {
    private growthPercentage = 0;
    private curveUpwardAmountBase = dna.growth.boneCurveUpwardsFactor;

    public get isAlive() {
        return this.growthPercentage > 0;
    }

    public getGrowthPercentage() {
        return this.growthPercentage;
    }

    /**
     * The thing growing out of this component, if it exists.
     *
     * undefined = hasn't reached growth event yet (initial state).
     * null = reached growth state, and we're not growing anything.
     * non-null = the component we're growing.
     */
    private components: Component[] | null | undefined;

    /**
     * Manually call pose after you've calculated the inverses of all these branches.
     */
    constructor(public index: number, public branch: Branch) {
        super(null as any);
        // be careful - we can't shrink ourselves down until we've calculated the inverses in the skeleton.
        // this.updateView();
    }

    simulate(t: number) {
        if (!this.isAlive) {
            return;
        }
        if (this.growthPercentage > dna.growth.budDevelopmentThreshold && this.components === undefined) {
            const components = dna.branchingPattern.getComponentsFor(this);
            this.components = components;
            if (components != null) {
                for (const c of components) {
                    c.scale.multiplyScalar(dna.growth.childScalar);
                }
                this.add(...components);
            }
        }

        // Model that curving upwards behavior that branches do.
        // we don't want to always do this - we don't want to do this once we hit
        // ~90% nutrient. (ballpark)
        const curveAmount = THREE.Math.mapLinear(this.growthPercentage, 0, 0.9, this.curveUpwardAmountBase, 0);
        if (curveAmount > 0) {
            // this is the same as getWorldQuaternion() but without eating the
            // computeMatrixWorld (which will be computed each frame by .render() anyways) perf hit (which is ~30% of total traverse)
            // essentially we lag one frame behind, but that's no problem since we're
            // growing slowly anyways
            this.matrixWorld.decompose(dummyPosition, q, dummyScale);

            q.slerp(QUATERNION_UP, 1.0 + curveAmount);
            this.quaternion.multiply(q);
        }

        // Model rocking back and forth while growing.
        // don't do this once we hit ~80% nutrient.
        let rotateScalar = THREE.Math.mapLinear(this.growthPercentage * (1 - this.growthPercentage), 0, 0.25, 0, 1);
        rotateScalar = Math.sqrt(rotateScalar);
        if (rotateScalar > 0) {
            const time = Date.now();
            this.rotation.x = 0.1 * Math.sin(time / 4000) * rotateScalar;
            // TODO add a z rotation that can create twisty branches
            this.rotation.y = 0.01 * rotateScalar * Math.sin(time / 10000);
        }
    }

    feed(t: number, nutrients: number) {
        const percentOfNutrientsWanted = THREE.Math.mapLinear(this.growthPercentage, 0, 1, dna.growth.feedSelfMax, 0.01);
        const nutrientsForMe = nutrients * percentOfNutrientsWanted;
        const nutrientsLeft = nutrients - nutrientsForMe;
        const newGrowthPercentage = Math.min(1, this.growthPercentage + nutrientsForMe);
        const leftOver = ((this.growthPercentage + nutrientsForMe) - newGrowthPercentage) + nutrientsLeft;
        this.growthPercentage = newGrowthPercentage;

        this.simulate(t);

        if (leftOver > 0) {
            for (const child of this.children) {
                // we're physically inaccurate here when there's more than one child, but that's fine.
                if (child instanceof BranchBone) {
                    child.feed(t, leftOver);
                }
            }
        }
        this.updateView();
    }

    updateView() {
        const scalar = THREE.Math.mapLinear(this.growthPercentage, 0, 1, 0.01, MAX_GROWTH_SCALE);
        this.scale.setScalar(scalar);
    }
}

export class BranchSkeleton extends THREE.Skeleton {
    bones!: BranchBone[];

    constructor(bones: BranchBone[]) {
        super(bones);
    }
}
