import { Box2, Math as THREEMath, Vector2 } from "three";

import { ReasonStopped, Vein } from "./vein";

const { abs, min, max, exp, pow, PI, floor } = Math;
const { randFloat: random, randInt, mapLinear: map } = THREEMath;

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

    // unrelated to veined leaf directly but used in 3D geom generation
    yLiftFrequency: number;

    yLiftAmount: number;

    yWeightLiftScale: number;

    yCupAmount: number;

    yNoiseScalar: number;

    curlSidesAmount?: number;
}

export function generateVeinGrowthParameters(): IVeinGrowthParameters {
    return {
        TOO_CLOSE_DIST: 1,
        EXPAND_SCALAR: random(0.75, 1.25), // 0.75; //1
        get EXPAND_DIST() { return this.TOO_CLOSE_DIST * this.EXPAND_SCALAR },
        MAX_PATH_COST: 200,
        SIDEWAYS_COST_RATIO: random(-1, 1) * random(0, 1) * 0.5, // 0.5;
        SIDE_ANGLE: random(PI / 6, PI / 2), // PI / 3;
        SIDE_ANGLE_RANDOM: random(0, 1) * random(0, 1) * PI / 2, // random(0, PI / 4); //PI / 6;
        DEPTH_STEPS_BEFORE_BRANCHING: 1 + randInt(0, 3), // 2
        SECONDARY_BRANCH_PERIOD: 1 + floor(random(0, 1) * random(0, 1) * random(0, 1) * 6),
        TURN_TOWARDS_X_FACTOR: random(0, 1) * random(0, 1) * 1, // 0.2
        AVOID_NEIGHBOR_FORCE: random(0, 1) * random(0, 1) * 1, // 1
        randWiggle: random(0, 0.04) * random(0, 1),
        BASE_DISINCENTIVE: Math.max(0, pow(10, random(0, 4)) - 3),
        COST_DISTANCE_TO_ROOT_DIVISOR: 1e3,
        COST_NEGATIVE_X_GROWTH: pow(10, random(-1, 0)), // 0.2
        GROW_FORWARD_FACTOR: pow(10, random(0, 2)), // 10
        SECONDARY_BRANCH_SCALAR: 1 - (random(0, 1) * random(0, 1) * 0.2), // 0.85;
        COST_TO_TURN: random(0, 1) * random(0, 5),
        growForwardBranch: true,
        yLiftFrequency: random(6, 12),
        yLiftAmount: random(-0.03, 0.12) * random(0, 1),
        yWeightLiftScale: random(0, 0.003),
        yCupAmount: -random(0.5, 1) * random(0.75, 1) * random(0.75, 1.25),
        yNoiseScalar: random(0, 1) * random(0, 1) * 0.002,
    };
}

export function generatePetalGrowthParameters(): IVeinGrowthParameters {
    return {
        TOO_CLOSE_DIST: 1,
        EXPAND_SCALAR: 1.25,
        get EXPAND_DIST() { return this.TOO_CLOSE_DIST * this.EXPAND_SCALAR },
        MAX_PATH_COST: 200,
        SIDEWAYS_COST_RATIO: random(-0.3, 0.2) + random(0, 1) * random(0, 1) * random(0, 1) * random(0, 1) * 1.5, // 0.5;
        SIDE_ANGLE: random(PI / 7, PI / 5), // PI / 3;
        SIDE_ANGLE_RANDOM: random(0, 1) * PI / 4, // random(0, PI / 4); //PI / 6;
        DEPTH_STEPS_BEFORE_BRANCHING: 2, // 2
        SECONDARY_BRANCH_PERIOD: 1,
        TURN_TOWARDS_X_FACTOR: random(0, 1) * 0.2, // 0.2
        AVOID_NEIGHBOR_FORCE: random(0, 1) * 0.75, // 1
        randWiggle: random(0, 0.5) * random(0, 1),
        BASE_DISINCENTIVE: Math.pow(10, random(0.5, 2)),
        COST_DISTANCE_TO_ROOT_DIVISOR: 5e2,
        COST_NEGATIVE_X_GROWTH: 1,
        GROW_FORWARD_FACTOR: random(10, 30),
        SECONDARY_BRANCH_SCALAR: random(0.8, 1),
        COST_TO_TURN: random(-0.5, 0.5),
        growForwardBranch: true,
        yLiftAmount: 0,
        yLiftFrequency: 0,
        yWeightLiftScale: random(0, 0.001),
        yCupAmount: random(0.75, 1.25),
        curlSidesAmount: random(0, 1.5),
        yNoiseScalar: random(0.001, 0.004),
    };
}

// TODO fill this in
export function generateTepalGrowthParameters(): IVeinGrowthParameters {
    return {
        TOO_CLOSE_DIST: 1,
        EXPAND_SCALAR: 1.25,
        get EXPAND_DIST() { return this.TOO_CLOSE_DIST * this.EXPAND_SCALAR },
        MAX_PATH_COST: 40,
        SIDEWAYS_COST_RATIO: 1.5, // random(-0.3, 0.2), // 0.5;
        SIDE_ANGLE: random(PI / 9, PI / 2), // PI / 3;
        SIDE_ANGLE_RANDOM: 0.1, // random(0, 1) * PI / 4, // random(0, PI / 4); //PI / 6;
        DEPTH_STEPS_BEFORE_BRANCHING: 2, // 2
        SECONDARY_BRANCH_PERIOD: 1,
        TURN_TOWARDS_X_FACTOR: random(-2.0, -0.5), // 0.2
        AVOID_NEIGHBOR_FORCE: random(0, 1.2), // 1
        randWiggle: 0.00,
        BASE_DISINCENTIVE: 0,
        COST_DISTANCE_TO_ROOT_DIVISOR: 10e2,
        COST_NEGATIVE_X_GROWTH: 3.0,
        GROW_FORWARD_FACTOR: 0.5,
        SECONDARY_BRANCH_SCALAR: random(0.8, 1),
        COST_TO_TURN: 2,
        growForwardBranch: true,
        yLiftAmount: 0,
        yLiftFrequency: 0,
        yWeightLiftScale: random(0, 0.001),
        yCupAmount: 0.15,
        curlSidesAmount: random(0.75, 1),
        yNoiseScalar: 0.002,
    };
}

export class VeinedLeaf {
    public world: Vein[] = [];

    root: Vein;
    // outer boundary from last growth step
    boundary: Vein[] = [];
    // nodes without any children
    terminalNodes: Vein[] = [];

    finished = false;

    public normalizationDownScalar?: number;

    constructor(public growthParameters: IVeinGrowthParameters) {
        this.root = new Vein(new Vector2(this.growthParameters.EXPAND_DIST, 0), this);
        this.root.distanceToRoot = 0;
        this.root.costToRoot = 0;
        this.boundary.push(this.root);
    }

    /**
     * Unit square scale this leaf - make all veins fit perfectly in a unit box [0, 1]x[0, 1], maintaining aspect ratio.
     */
    public computeNormalizedPositions() {
        // e.g. [-10, 100];
        const boundingBox = this.getBoundingBox();
        const translateX = -boundingBox.min.x;

        // 1 / (100 - -10) = 1 / 110 = 0.0091
        this.normalizationDownScalar = 1 / Math.max(
            boundingBox.max.x - boundingBox.min.x,
            boundingBox.max.y - boundingBox.min.y,
        );
        for (const vein of this.world) {
            vein.normalizedPosition.copy(vein.position);
            vein.normalizedPosition.x += translateX;
            vein.normalizedPosition.multiplyScalar(this.normalizationDownScalar);
        }
    }

    expandBoundary() {
        if (this.finished) {
            return;
        }

        // reset weights
        for (const s of this.world) {
            s.weight = -1;
        }
        this.root.computeWeight();

        const newBoundary: Vein[] = [];
        for (const s of this.boundary) {
            s.branchOut();
            newBoundary.push(...s.children);
        }
        if (newBoundary.length === 0) {
            this.finished = true;
        }
        // world.addAll(newBoundary);

        for (const s of this.boundary) {
            if (s.children.length === 0) {
                this.terminalNodes.push(s);
            }
        }
        this.boundary = newBoundary;

        // for (Small s : world) {
        //  if (s.children.size() == 0) {
        //    terminalNodes.add(s);
        //  }
        // }

        // reset weights
        for (const s of this.world) {
            s.weight = -1;
        }
        this.root.computeWeight();
        // Collections.sort(world, new Comparator() {
        //  public int compare(Object obj1, Object obj2) {
        //    Small s1 = (Small)obj1;
        //    Small s2 = (Small)obj2;
        //    return Integer.compare(s1.weight, s2.weight);
        //  }
        // }
        // );
    }

    draw(context: CanvasRenderingContext2D) {
        context.save();
        this.drawWorld(context);
        context.restore();
    }

    drawWorld(context: CanvasRenderingContext2D) {
        // computes whole subtree
        this.root.computeWeight();
        context.strokeStyle = "rgba(0, 0, 0, 0.5)";
        for (const s of this.world) {
            context.lineWidth = Math.log(1 + s.weight) / 10;
            context.beginPath();
            s.draw(context);
            context.stroke();
            //   textAlign(BOTTOM, RIGHT);
            // text(int(100 * (s.costToRoot / MAX_PATH_COST)), s.position.x, s.position.y);
            // text(s.weight, s.position.x, s.position.y);
            // text(s.numTurns, s.position.x, s.position.y);
        }

        context.beginPath();
        context.lineWidth = 1;
        context.strokeStyle = "rgb(64, 255, 75)";
        for (const s of this.terminalNodes) {
            if (s.reason === ReasonStopped.Expensive) {
                s.draw(context);
            }
        }
        context.stroke();

        // drawBoundary();
    }

    // degenerate:
    //   terminal nodes who are terminal because it was too expensive.size < 10
    isDegenerate() {
        return this.terminalNodes.filter((t) => t.reason === ReasonStopped.Expensive).length < 10;
    }

    getBoundingBox() {
        const boundingBox = new Box2();
        for (const vein of this.world) {
            boundingBox.expandByPoint(vein.position);
        }
        return boundingBox;
    }
}

export function generateRandomVeinedLeaf(parameterGen: () => IVeinGrowthParameters) {
    let veinedLeaf: VeinedLeaf;
    do {
        veinedLeaf = new VeinedLeaf(parameterGen());
        // this really shouldn't hit 1000, expandBoundary will make this basically a no-op once it's finished
        for (let i = 0; i < 1000; i++) {
            veinedLeaf.expandBoundary();
        }
    } while (veinedLeaf.isDegenerate());
    veinedLeaf.computeNormalizedPositions();
    return veinedLeaf;
}
