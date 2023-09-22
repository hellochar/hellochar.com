import * as THREE from "three";

import { lerp } from "../../../../math";
import dna from "../../dna";
import { rotateMove } from "../../physics";
import { Branch, FlowerWhorlBranch } from "./branch";
import { Bud } from "./bud";

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
 * Call feed(nutrients) on it. feed(nutrients) gives this branch some amount of nutrients. The
 * branch can choose to consume the nutrients, or feed it to its children in any distribution.
 *
 * The BranchBone will update its THREE position/rotation/scale accordingly.
 */
export class BranchBone extends THREE.Bone {
    private growthPercentage = 0;
    public curveUpwardAmountBase = dna.growth.boneCurveUpwardsFactor;

    public get isAlive() {
        return this.growthPercentage > 0;
    }

    public getGrowthPercentage() {
        return this.growthPercentage;
    }

    private get isFullSized() {
        return this.growthPercentage >= 1;
    }

    /**
     * You should call .updateView() after you've added these bones to a skeleton and .bind() it to a SkinnedMesh.
     */
    constructor(public index: number, public branch: Branch) {
        super();
    }

    private buds: Bud[] = [];
    public addBud(bud: Bud) {
        this.buds.push(bud);
        this.add(bud);
    }

    grow(t: number) {
        if (!this.isAlive) {
            return;
        }

        const globalScale = new THREE.Vector3().setFromMatrixScale(this.matrixWorld).lengthSq();
        const zRot = (1 - THREE.Math.smootherstep(globalScale, 0, 0.85)) * Math.PI / 6 * dna.growth.zCurlFactor;
        this.rotation.z = zRot;

        // Model that curving upwards behavior that branches do.
        // we don't want to always do this - we don't want to do this once we hit
        // ~90% nutrient. (ballpark)
        const curveAmount = THREE.Math.mapLinear(this.growthPercentage, 0, 0.9, this.curveUpwardAmountBase, 0);
        if (this.branch instanceof FlowerWhorlBranch) {
            this.rotation.z *= 0.1;
        }
        if (curveAmount > 0) {
            // Get the world quaternion. This is the same as getWorldQuaternion() but without eating the
            // computeMatrixWorld (which will be computed each frame by .render() anyways) perf hit (which is ~30% of total traverse)
            // essentially we lag one frame behind, but that's no problem since we're
            // growing slowly anyways
            this.matrixWorld.decompose(dummyPosition, q, dummyScale);

            q.slerp(QUATERNION_UP, 1.0 + curveAmount);
            this.quaternion.multiply(q);
        }

        // Model rocking back and forth while growing.
        let rotateScalar = THREE.Math.mapLinear(this.growthPercentage * (1 - this.growthPercentage), 0, 0.25, 0, 1);
        rotateScalar = Math.sqrt(rotateScalar);
        if (rotateScalar > 0) {
            const time = Date.now();
            this.rotation.x = 0.1 * Math.sin(time / 4000) * rotateScalar;
            this.rotation.y = lerp(0.05 * Math.sin(time / 10000), this.finalYRotation, this.growthPercentage);
        }
    }

    private finalYRotation = THREE.Math.randFloat(-0.1, 0.1) * 2;

    feed(t: number, nutrients: number) {
        const oldFullSized = this.isFullSized;
        const percentOfNutrientsWanted = THREE.Math.mapLinear(this.growthPercentage, 0, 1, dna.growth.feedSelfMax, 0.01);
        const nutrientsForMe = nutrients * percentOfNutrientsWanted;
        const nutrientsLeft = nutrients - nutrientsForMe;
        const newGrowthPercentage = Math.min(1, this.growthPercentage + nutrientsForMe);
        const leftOver = ((this.growthPercentage + nutrientsForMe) - newGrowthPercentage) + nutrientsLeft;
        this.growthPercentage = newGrowthPercentage;
        if (leftOver > 0) {
            for (const child of this.children) {
                // we're physically inaccurate here when there's more than one child, but that's fine.
                if (child instanceof BranchBone) {
                    child.feed(t, leftOver);
                } else if (child instanceof Bud) {
                    child.feed(t, leftOver);
                }
            }
        }

        if (!oldFullSized) {
            this.grow(t);
            this.updateView();
        } else {
            this.matrixAutoUpdate = false;
        }
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
