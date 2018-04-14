import * as THREE from "three";

export interface LeafGrowthParameters {
    // unused in growth, used in the final Leaf
    petioleLength: number;
    mainAxisDist: number;
    secondaryAxisDistBase: number;
    secondaryAxisAngle: number;
    scale: number;
    sideScale: number;
    iterations: number;
    scaleMultiplier: number;
    mainAxisDistMultiplier: number;
    angleScalar: number;
    maxSideDepth: number;
    alwaysSecondary: boolean;
    fn: (x: number) => number;
}

export function generateRandomGrowthParameters(): LeafGrowthParameters {
    // let mainAxisDist = 0.4;
    const mainAxisDist = THREE.Math.randFloat(0.5, 1);
    // let mainAxisDist = 0.3;
    const secondaryAxisDistBase = THREE.Math.randFloat(0.4, 0.8);
    // let secondaryAxisDist = 0.15;
    const secondaryAxisAngle = THREE.Math.randFloat(Math.PI / 12, Math.PI / 3);
    // const secondaryAxisAngle = Math.PI / 2;
    const scale = THREE.Math.randFloat(0.9, 1.0);
    const iterations = THREE.Math.randInt(2, 6);
    // const iterations = 6;
    const scaleMultiplier = THREE.Math.randFloat(0.9, 1);
    // const scaleMultiplier = 0.6;
    // const scaleMultiplier = 1;
    // const mainAxisDistMultiplier = 1;
    const sideScale = 0.8;
    const mainAxisDistMultiplier = Math.sqrt(THREE.Math.randFloat(0.8, 1));
    const angleScalar = THREE.Math.randFloat(0.8, 1 / 0.8);
    // const maxSideDepth = 1;
    const maxSideDepth = THREE.Math.randInt(0, 3);
    const alwaysSecondary = false; // Math.random() < 0.5 ? true : false;
    const secondaryAxisDistFns: Array<(x: number) => number> = [
        (x) => x * (1 - x),
        (x) => Math.pow(0.2, x),
        (x) => Math.pow(0.5, x),
        (x) => 1 / (1 + x),
    ];
    const fn = secondaryAxisDistFns[THREE.Math.randInt(0, secondaryAxisDistFns.length - 1)];
    const petioleLength = Math.random() < 0.5 ? 0 : THREE.Math.randFloat(0.1, 1.0);
    return {
        petioleLength,
        mainAxisDist,
        secondaryAxisDistBase,
        secondaryAxisAngle,
        scale,
        iterations,
        scaleMultiplier,
        sideScale,
        mainAxisDistMultiplier,
        angleScalar,
        maxSideDepth,
        alwaysSecondary,
        fn,
    };
}
export class LeafNode extends THREE.Bone {
    // position - position relative to parent.
    // leaves grow in the +x direction - that is the primary vein direction.
    // root leaf node is at 0,0,0.
    // +-z are the secondary vein directions
    // +-y is the curl/waviness direction
    constructor(public depth: number, public sideDepth: number) {
        super(null as any);
    }

    public nodeChildren?: LeafNode[];
    public leftNode?: LeafNode;
    public forwardNode?: LeafNode;
    public rightNode?: LeafNode;

    public index!: number;

    public addChildren(
        mainAxisDist: number,
        secondaryAxisDist: number,
        secondaryAxisAngle: number,
        scale: number,
        secondaryScale: number,
        maxSideDepth: number,
        alwaysSecondary: boolean,
    ) {
        this.nodeChildren = [];

        let totalRotation = 0;
        for (let node: LeafNode = this; node instanceof LeafNode; node = node.parent as LeafNode) {
            totalRotation += node.rotation.y;
        }
        // don't add super curly children
        if (Math.abs(totalRotation) > Math.PI * 3 / 2) {
            return this.nodeChildren;
        }

        if (this.sideDepth > maxSideDepth) {
            return this.nodeChildren;
        }
        const sideScale = scale * secondaryScale;
        // maybe don't put a secondary vein going in towards the leaf
        //  >= 0;
        if (totalRotation >= 0 || alwaysSecondary) {
            const leftNode = this.leftNode = new LeafNode(this.depth + 1, this.sideDepth + 1);
            leftNode.position.x = secondaryAxisDist;
            leftNode.position.applyEuler(new THREE.Euler(0, secondaryAxisAngle, 0));
            leftNode.rotation.y = secondaryAxisAngle;
            leftNode.scale.set(sideScale, sideScale, sideScale);
            this.add(leftNode);
            this.nodeChildren.push(leftNode);
        }

        // extend the main axis
        const forwardNode = this.forwardNode = new LeafNode(this.depth + 1, this.sideDepth);
        forwardNode.position.x = mainAxisDist;
        forwardNode.scale.set(scale, scale, scale);
        this.add(forwardNode);
        this.nodeChildren.push(forwardNode);

        if (totalRotation <= 0 || alwaysSecondary) {
            const rightNode = this.rightNode = new LeafNode(this.depth + 1, this.sideDepth + 1);
            rightNode.position.x = secondaryAxisDist;
            rightNode.position.applyEuler(new THREE.Euler(0, -secondaryAxisAngle, 0));
            rightNode.rotation.y = -secondaryAxisAngle;
            rightNode.scale.set(sideScale, sideScale, sideScale);
            this.add(rightNode);
            this.nodeChildren.push(rightNode);
        }
        return this.nodeChildren;
    }
}

export class LeafSkeleton extends THREE.Skeleton {
    // set in super
    public bones!: LeafNode[];

    // layer 0 is the root, layer 1 is [left, mid, right], layer 2 is same, sorted left to right
    // each layer is sorted left to right within that layer
    public depthLayers: LeafNode[][];
    public sideDepthLayers: LeafNode[][];

    // nodes who have no children
    public edgeLayer: LeafNode[];

    public rootNode: LeafNode;

    constructor(nodes: LeafNode[]) {
        super(nodes);
        this.rootNode = nodes[0];

        this.edgeLayer = nodes.filter((node) => node.nodeChildren == null || node.nodeChildren.length === 0);
        // root node should be an edge
        this.edgeLayer.push(this.rootNode);

        // compute depth and sideDepth
        this.depthLayers = [];
        this.sideDepthLayers = [];
        for (let i = 0; i < nodes.length; i++) {
            const leafNode = nodes[i];
            leafNode.index = i;
            const { depth, sideDepth } = leafNode;
            this.sideDepthLayers[sideDepth] = this.sideDepthLayers[sideDepth] || [];
            this.sideDepthLayers[sideDepth].push(leafNode);
            this.depthLayers[depth] = this.depthLayers[depth] || [];
            this.depthLayers[depth].push(leafNode);
        }
    }

    static grow(params: LeafGrowthParameters) {
        const rootNode = new LeafNode(0, 0);

        const allLeafNodes = [rootNode];
        let boundary = [rootNode];
        const edgeLayer = [rootNode];
        const {
            iterations,
            secondaryAxisDistBase,
            fn,
            angleScalar,
            mainAxisDistMultiplier,
            scaleMultiplier,
            sideScale,
            maxSideDepth,
            alwaysSecondary,
        } = params;
        let { scale, mainAxisDist, secondaryAxisAngle } = params;
        for (let i = 0; i < iterations; i++) {
            const x = i / iterations;
            const secondaryAxisDist = secondaryAxisDistBase * fn(x);
            const newBoundary: LeafNode[] = [];
            for (const leafNode of boundary) {
                const children = leafNode.addChildren(mainAxisDist, secondaryAxisDist, secondaryAxisAngle, scale, sideScale, maxSideDepth, alwaysSecondary);
                newBoundary.push(...children);
            }
            boundary = newBoundary;
            allLeafNodes.push(...newBoundary);
            scale *= scaleMultiplier;
            mainAxisDist *= mainAxisDistMultiplier;
            secondaryAxisAngle *= angleScalar;
        }

        return new LeafSkeleton(allLeafNodes);
    }
}
