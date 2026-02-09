import { Math as THREEMath, Vector2 } from "three";
import { VeinedLeaf } from "./veinedLeaf";

const {abs, min, max, exp, pow, PI, floor} = Math;
const { randFloat: random, randInt, mapLinear: map } = THREEMath;

function noise(t: number) {
    return (Math.sin(t * 15934.1249 + 50963.21) % 1 + 1) % 1;
}

function symmetricRandom(low: number, high: number, y: number) {
  return map(noise(y) + noise(-y), 0, 2, low, high);
}

export enum ReasonStopped { Crowded, Expensive }

export class Vein {
    parent?: Vein;
    children: Vein[];
    // number of ancestors in this subtree,
    // computed with computeWeight()
    weight: number = -1;
    // cached sum of all offsets up to root
    distanceToRoot!: number;
    // similar to distance to root but make sideways movement more expensive
    costToRoot!: number;
    // number of parents away from root
    depth: number = 0;
    // on the path to root, the number of turns you have to make
    numTurns: number = 0;
    isTerminal: boolean = false;

    /**
     * this vein's normalized position in the leaf once the leaf is finished.
     * x is in [0, 1]
     * y is in [-0.5, 0.5]
     */
    public normalizedPosition: Vector2 = new Vector2();

    constructor(public position: Vector2, public leaf: VeinedLeaf) {
        this.children = [];
        leaf.world.push(this);
    }

    computeCost(s: Vein, sOffset: Vector2) {
        // consider first child the "straight" child
        let isTurn: boolean = true;
        if (this.children.length === 0) {
            s.numTurns = this.numTurns;
            isTurn = false;
        } else {
            s.numTurns = this.numTurns + 1;
            isTurn = true;
        }

        const {
            TOO_CLOSE_DIST,
            EXPAND_SCALAR,
            EXPAND_DIST,
            MAX_PATH_COST,
            SIDEWAYS_COST_RATIO,
            SIDE_ANGLE,
            SIDE_ANGLE_RANDOM,
            DEPTH_STEPS_BEFORE_BRANCHING,
            SECONDARY_BRANCH_PERIOD,
            TURN_TOWARDS_X_FACTOR,
            AVOID_NEIGHBOR_FORCE,
            randWiggle,
            BASE_DISINCENTIVE,
            COST_DISTANCE_TO_ROOT_DIVISOR,
            COST_NEGATIVE_X_GROWTH,
            GROW_FORWARD_FACTOR,
            SECONDARY_BRANCH_SCALAR,
            COST_TO_TURN,
            growForwardBranch,
        } = this.leaf.growthParameters;

        let cost = 0;
        // base cost of growth - offset units
        cost += sOffset.length();

        // original cost function, offset units
        // cost += dist(0, 0, sOffset.x, sOffset.y * (1 + SIDEWAYS_COST_RATIO));

        // disincentivize growing too laterally - offset units
        cost += abs(sOffset.y * sOffset.y) * SIDEWAYS_COST_RATIO;

        // incentivize growing forward - offset units
        cost -= min(0, (sOffset.x - abs(sOffset.y)) / EXPAND_DIST * GROW_FORWARD_FACTOR);

        // disincentivize getting too wide - position units
        // disabled - this helps control line vs round but that's already controlled with sideways_cost_ratio
        // cost += abs(s.position.y * s.position.y) * 0.01;

        // super disincentivize growing too far, this is an exponential - position units
        // this is kind of just a failsafe to prevent rampant growth from other costs
        // we should probably just keep this at like 1e5 or so
        cost += s.distanceToRoot * s.distanceToRoot / COST_DISTANCE_TO_ROOT_DIVISOR;

        // disincentivize growing behind you - position units
        cost += exp(-s.position.x * COST_NEGATIVE_X_GROWTH);
        // prnumberln(cost);
        // cost += max(0, -s.position.x) * COST_BEHIND_GROWTH;

        // disincentivize growing laterally when you're too close to the base - position units
        // this makes nice elliptical shapes
        cost += BASE_DISINCENTIVE * s.position.y * s.position.y * 1 / (1 + s.position.x * s.position.x);

        // Small lastBranch = this;
        //// children.get(0) is usually the forward vein. But we do .get(0) to be adaptable for
        //// other cases (not-always-growing-forward, or forward vein is blocked)
        //// keep going backwards until you hit a turn.
        //// incentivize going straight
        // number l = 0;
        // while (lastBranch.parent != null && lastBranch.parent.children.get(0) == lastBranch) {
        //  lastBranch = lastBranch.parent;
        //  l++;
        // }
        //// prnumberln(l, lastBranch.weight, log(1 + lastBranch.weight));
        // cost -= log( 1 + lastBranch.weight * STRAIGHT_INCENTIVE_FACTOR );

        // disincentivize curving too much
        // cost += s.numTurns * STRAIGHT_INCENTIVE_FACTOR;

        // disincentivize turns
        if (isTurn) {
            cost += COST_TO_TURN;
        }

        // disincentivize growing laterally when you're too close to the base, but with much stronger falloff - position units
        // good parameters
        // cost += 1000 * s.position.y * s.position.y * 1 / (1 + exp(s.position.x * s.position.x / 200));
        // cost += BASE_DISINCENTIVE * s.position.y * s.position.y * 1 / (1 + exp(s.position.x * s.position.x / BASE_DIST_FALLOFF));

        // give an incentive for going over a specific point - position units
        // cost -= 100 / (1 + exp(30 - s.position.x));

        // incentivize middle distances to the root
        // cost -= 1000 / (1 + exp(pow(50 - s.distanceToRoot, 2) / 100));

        // incentivize growing in the middle area
        // cost -=

        return cost;
    }

    add(s: Vein) {
        s.parent = this;
        s.depth = this.depth + 1;
        this.children.push(s);
        const sOffset = s.offset();
        const mag = sOffset.length();
        s.distanceToRoot = this.distanceToRoot + mag;
        s.costToRoot = this.costToRoot + this.computeCost(s, sOffset);
    }

    offset() {
        if (this.parent != null) {
            return this.position.clone().sub(this.parent.position);
        } else {
            return this.position.clone();
        }
    }

    reason?: ReasonStopped;
    // attempt to grow outwards in your direction and to the side
    branchOut() {
        if (this.isTerminal) {
            this.reason = ReasonStopped.Crowded;
            return;
        }

        const {
            TOO_CLOSE_DIST,
            EXPAND_SCALAR,
            EXPAND_DIST,
            MAX_PATH_COST,
            SIDEWAYS_COST_RATIO,
            SIDE_ANGLE,
            SIDE_ANGLE_RANDOM,
            DEPTH_STEPS_BEFORE_BRANCHING,
            SECONDARY_BRANCH_PERIOD,
            TURN_TOWARDS_X_FACTOR,
            AVOID_NEIGHBOR_FORCE,
            randWiggle,
            BASE_DISINCENTIVE,
            COST_DISTANCE_TO_ROOT_DIVISOR,
            COST_NEGATIVE_X_GROWTH,
            GROW_FORWARD_FACTOR,
            SECONDARY_BRANCH_SCALAR,
            COST_TO_TURN,
            growForwardBranch,
        } = this.leaf.growthParameters;

        const offset = this.offset();
        const mag = offset.length();
        const forward = offset.normalize();

        if (growForwardBranch || this.depth % DEPTH_STEPS_BEFORE_BRANCHING !== 0) {
            const heading = forward.clone();
            // make offset go towards +x
            heading.x += (1 - heading.x) * TURN_TOWARDS_X_FACTOR;
            heading.rotateAround(new Vector2(), symmetricRandom(-randWiggle, randWiggle, 32 + this.position.x * 1242.319 + this.position.y * 1960)).normalize();
            // keep the same mag when moving forward
            this.reason = this.maybeAddBranch(heading, mag * 1.0);
        }

        let sideScalar = 1.0;
        const branchDepth = floor(this.depth / DEPTH_STEPS_BEFORE_BRANCHING);
        sideScalar = branchDepth % SECONDARY_BRANCH_PERIOD === 0 ? 1 : SECONDARY_BRANCH_SCALAR;
        const rotAngle = SIDE_ANGLE + symmetricRandom(-SIDE_ANGLE_RANDOM, SIDE_ANGLE_RANDOM, this.position.y);
        if (this.depth % DEPTH_STEPS_BEFORE_BRANCHING === 0) {
            const positiveTurnOffset = forward.clone().rotateAround(new Vector2(), rotAngle);
            this.maybeAddBranch(positiveTurnOffset, mag * sideScalar);
        }
        if (this.depth % DEPTH_STEPS_BEFORE_BRANCHING === 0) {
            const negativeTurnOffset = forward.clone().rotateAround(new Vector2(), -rotAngle);
            this.maybeAddBranch(negativeTurnOffset, mag * sideScalar);
        }
    }

    /**
     * Get the non-immediate-family Small nearest to the point.
     */
    nearestCollidableNeighbor(point: Vector2) {
        let nearestNeighbor: Vein | undefined;
        let nearestNeighborDist = 1e10;
        for (const s of this.leaf.world) {
            if (this.isImmediateFamily(s)) {
                continue;
            }
            const dist = s.position.distanceTo(point);
            if (dist < nearestNeighborDist) {
                nearestNeighborDist = dist;
                nearestNeighbor = s;
            }
        }
        return nearestNeighbor;
    }

    isImmediateFamily(s: Vein) {
        return s === this || s.parent === this;
    }

    isAncestor(s: Vein) {
        let tester: Vein | undefined = this;
        while (tester != null) {
            if (tester === s) {
                return true;
            } else {
                tester = tester.parent;
            }
        }
        return false;
    }

    /**
     * Returns a new heading after the old would-be point has been repelled from everyone except
     * immediate family (siblings or parent)
     */
    avoidEveryone(heading: Vector2, mag: number) {
        const offset = heading.clone().multiplyScalar(mag);
        const position = this.position.clone().add(offset);
        const force = new Vector2();
        for (const s of this.leaf.boundary) {
            if (this.isImmediateFamily(s) || this.isAncestor(s)) {
                continue;
            }
            const dist = s.position.distanceTo(position);
            if (dist > 0) {
                const awayFromNeighborOffset = position.clone().sub(s.position);
                const forceMag = this.leaf.growthParameters.AVOID_NEIGHBOR_FORCE / (dist * dist);
                // number forceMag = AVOID_NEIGHBOR_FORCE / dist;
                awayFromNeighborOffset.setLength(forceMag);
                force.add(awayFromNeighborOffset);
            }
        }
        // note - this can actually move you numbero another neighbor... just ignore that for now though
        const newHeading = offset.clone().add(force).normalize();
        return newHeading;
    }

    public nearestNeighbor?: Vein;

    maybeAddBranch(heading: Vector2, mag: number) {
        if (this.costToRoot > this.leaf.growthParameters.MAX_PATH_COST) {
            return ReasonStopped.Expensive;
        }
        //// make offset go towards +x
        // offset.x += (EXPAND_DIST - offset.x) * TURN_TOWARDS_X_FACTOR;
        // offset.setMag(EXPAND_DIST);
        const avoidedHeading = this.avoidEveryone(heading, mag);
        // we've now moved away from everyone.
        const childPosition = this.position.clone().add(avoidedHeading.setLength(mag));
        const isTerminal = false;
        this.nearestNeighbor = this.nearestCollidableNeighbor(childPosition);
        if (this.nearestNeighbor != null && this.nearestNeighbor.position.distanceTo(childPosition) < this.leaf.growthParameters.TOO_CLOSE_DIST) {
            // we're too close! terminate ourselves
            return ReasonStopped.Crowded;

            // isTerminal = true;
            // childPosition.set(nearestNeighbor.position);
        }

        const newSmall = new Vein(childPosition, this.leaf);
        newSmall.isTerminal = isTerminal;
        this.add(newSmall);
        return undefined;
    }

    draw(context: CanvasRenderingContext2D) {
        if (this.parent != null) {
            context.moveTo(this.parent.position.x, this.parent.position.y);
        } else {
            context.moveTo(0, 0);
        }
        context.lineTo(this.position.x, this.position.y);
    }

    computeWeight() {
        if (this.weight === -1) {
            let weight = 1;
            for (const s of this.children) {
                s.computeWeight();
                weight += s.weight;
            }
            this.weight = weight;
        }
    }
}
