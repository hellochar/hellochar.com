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

export interface IVeinGrowthParameters {
    /**
     * distance between branches. this kind of controls the fine detail of the leaves.
     */
    TOO_CLOSE_DIST: number;

    /**
     * < 0.5 always degenerates - no branching
     * 0.75 still has some degenerates
     * 0.75 to 1 - creates nicer complex boundaries
     * 1 - normal
     * 1 to 1.5 - makes more aristate and cuneate shapes
     * > 1.5 degenerates - vein crisscrossing
     */
    EXPAND_SCALAR: number;

    EXPAND_DIST: number;

    /**
     * max_path_cost
     * Linear scalar of how big the plant grows; good numbers are 100 to 1000.
     * For high fidelity, pump this up to like 5000
     */
    MAX_PATH_COST: number;

    /** sideways_cost_ratio
     * Powerful number that controls how fat the leaf grows.
     * -1 = obovate, truncate, obcordate
     * -0.2 = cuneate, orbicular
     * 0 = ellipse
     * 1+ = spear-shaped, linear, subulate
     */
    SIDEWAYS_COST_RATIO: number;

    /** side_angle
     * controls the complexity of the edge and angular look of the inner vein system
     *   <PI / 6 = degenerate "nothing grows" case.
     *   PI/6 to PI/2 = the fractal edge changes in interesting ways.
     *     generally at PI/6 it's more circular/round, and at PI/2 it's more pointy.
     */
    SIDE_ANGLE: number;

    /**
     * side_angle_random
     * adds a random noise to every side_angle
     * at 0 the leaf looks perfectly straight/mathematically curvy
     * and allows for interesting fragile vein patterns to appear
     *
     * as this bumps up the patterns will start to give way to chaos and
     * a more messy look.
     * This can open up the way for veins to flow in places they might not
     * have before.
     * This also risks non-symmetricness.
     *
     * Anything beyond like PI / 4 will be pretty messy.
     */
    SIDE_ANGLE_RANDOM: number;

    /**
     * turn_depths_before_branching
     * kind of like a detail slider - how dense do you want the veins to be.
     * 1 is messier and has "hair" veins
     * 2 is more uniform
     * 3+ bit spacious and e.g. gives room for turn_towards_x_factor
     * 6 is probably max here.
     */
    DEPTH_STEPS_BEFORE_BRANCHING: number;

    /**
     * secondary_branch_period
     * the period of small to big branching.
     * Larger periods tend to create more lobed/palmate boundary shapes.
     * Use in conjunction with SECONDARY_BRANCH_SCALAR.
     *
     * 1 will create no secondary branches.
     * 2-10 creates larger crevases.
     * To get complex boundaries, DEPTH_STEPS_BEFORE_BRANCHING * BRANCH_DEPTH_MOD should be around 10-20.
     */
    SECONDARY_BRANCH_PERIOD: number;

    /**
     * turn_towards_x_factor
     * gives veins an upwards curve.
     * 0 makes veins perfectly straight.
     * 1 makes veins curve sharply towards x.
     * careful - high numbers > 0.5 can cause degenerate early vein termination.
     * -1 is an oddity that looks cool but isn't really realistic (veins flowing backwards).
     */
    TURN_TOWARDS_X_FACTOR: number;

    /**
     * avoid_neighbor_force
     * tends to spread veins out even if they grow backwards
     * you probably want at least some of this; it gives variety and better texture to the veins
     * 100 is a decent amount
     * This may ruin fragile venation patterns though.
     * you can also go negative which creates these inwards clawing veins. It looks cool, but isn't really realistic.
     * avoid neighbor can help prevent early vein termination from e.g. turn_towards_x_factor.
     */
    AVOID_NEIGHBOR_FORCE: number;

    randWiggle: number;

    /** base_disincentive
     * 0 to 1, 10, 100, and 1000 all produce interesting changes
     * generally speaking, 0 = cordate, 1000 = linear/lanceolate
     */
    BASE_DISINCENTIVE: number;

    /** cost_distance_to_root
     * Failsafe on unbounded growth. Basically leave this around 1e5 to bound the plant at distance ~600.
     */
    COST_DISTANCE_TO_ROOT_DIVISOR: number;

    /**
     * cost_negative_x_growth
     * keeps leaves from unboundedly growing backwards.
     * 1e-3 and below basically has no effect.
     * from 1e-3 to 1, the back edge of the leaf shrinks to nothing.
     * You probably want this around 0.2 to 0.5.
     * Around 0.3 you can get cordate shapes with the right combination of parameters.
     */
    COST_NEGATIVE_X_GROWTH: number;

    /**
     * grow_forward_factor
     * basically incentivizes... growing forward. Makes leave ovate.
     * Anything below 10 basically has no effect.
     * At 100 basically every leaf becomes ovate, and also increases the number of steps taken.
     */
    GROW_FORWARD_FACTOR: number;

    /**
     * max 1,
     * below 0.7 it starts degenerating
     */
    SECONDARY_BRANCH_SCALAR: number;

    /**
     * Can help define a more jagged/deeper edge.
     * < -100 = makes things much fatter/more kidney-like. Creates quite complex edges.
     * -100 - 0 = incentivizes curving; creates edges with many fine little details.
     * 0 - 20 = no effect
     * 20 - 40 = helps make more jagged edges, like maple leaves (but it might be suppressed by other parameters)
     * 40 - 100 = even more jagged edges, but starting to degenerate
     * > 100 = degenerates
     */
    COST_TO_TURN: number;
    /**
     * You can set this to false and set the sideways angle between PI/6 and PI/12 to get dichotimous veining.
     * This might work for petals.
     */
    growForwardBranch: boolean;
}

export function generateVeinGrowthParameters(): IVeinGrowthParameters {
    return {
        TOO_CLOSE_DIST: 1,
        EXPAND_SCALAR: random(0.75, 1.25), // 0.75; //1
        get EXPAND_DIST() { return this.TOO_CLOSE_DIST * this.EXPAND_SCALAR },
        MAX_PATH_COST: 400,
        SIDEWAYS_COST_RATIO: random(-1, 1) * random(0, 1) * 0.5, // 0.5;
        SIDE_ANGLE: random(PI / 6, PI / 2), // PI / 3;
        SIDE_ANGLE_RANDOM: random(0, 1) * random(0, 1) * PI / 6, // random(0, PI / 4); //PI / 6;
        DEPTH_STEPS_BEFORE_BRANCHING: 1 + randInt(0, 3), // 2
        SECONDARY_BRANCH_PERIOD:  1 + floor(random(0, 1) * random(0, 1) * random(0, 1) * 6),
        TURN_TOWARDS_X_FACTOR: random(0, 1) * random(0, 1) * 0.1, // 0.2
        AVOID_NEIGHBOR_FORCE: random(0, 1) * random(0, 1) * 0.1, // 1
        randWiggle: 0.0,
        BASE_DISINCENTIVE: pow(10, random(0, 3)),
        COST_DISTANCE_TO_ROOT_DIVISOR: 5e2,
        COST_NEGATIVE_X_GROWTH: pow(10, random(-1, 0)), // 0.2
        GROW_FORWARD_FACTOR: pow(10, random(0, 2)), // 10
        SECONDARY_BRANCH_SCALAR: 1 - (random(0, 1) * random(0, 1) * 0.2), // 0.85;
        COST_TO_TURN: 0,
        growForwardBranch: true,
    };
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
        const nearestNeighbor = this.nearestCollidableNeighbor(childPosition);
        if (nearestNeighbor != null && nearestNeighbor.position.distanceTo(childPosition) < this.leaf.growthParameters.TOO_CLOSE_DIST) {
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
