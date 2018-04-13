import Delaunator from "delaunator";
import * as THREE from "three";

export class LeafNode extends THREE.Bone {
    // position - position relative to parent.
    // leaves grow in the +x direction - that is the primary vein direction.
    // root leaf node is at 0,0,0.
    // +-z are the secondary vein directions
    // +-y is the curl/waviness direction
    constructor(public depth: number, public sideDepth: number) {
        super(null as any);
        // this.add(new THREE.AxesHelper(0.1));
    }

    private nodeChildren?: LeafNode[];
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
        if (this.sideDepth > maxSideDepth) {
            return this.nodeChildren;
        }
        const sideScale = scale * secondaryScale;
        // maybe don't put a secondary vein going in towards the leaf
        //  >= 0;
        if (this.getWorldPosition().z <= 0 || alwaysSecondary) {
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

        if (this.getWorldPosition().z >= 0 || alwaysSecondary) {
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

export class LeafMesh extends THREE.Object3D {
    public skeleton: THREE.Skeleton;
    public mesh: THREE.SkinnedMesh;

    // layer 0 is the root, layer 1 is [left, mid, right], layer 2 is same, sorted left to right
    // each layer is sorted left to right within that layer
    public depthLayers: LeafNode[][];
    public sideDepthLayers: LeafNode[][];

    constructor() {
        super();
        const rootNode = new LeafNode(0, 0);
        // let mainAxisDist = 0.4;
        let mainAxisDist = THREE.Math.randFloat(0.5, 1);
        // let mainAxisDist = 0.3;
        let secondaryAxisDist = THREE.Math.randFloat(0.5, 1);
        // let secondaryAxisDist = 0.15;
        let secondaryAxisAngle = THREE.Math.randFloat(Math.PI / 12, Math.PI / 3);
        // const secondaryAxisAngle = Math.PI / 2;
        let scale = THREE.Math.randFloat(0.9, 1.0);
        const iterations = THREE.Math.randInt(2, 6);
        // const iterations = 6;
        const scaleMultiplier = THREE.Math.randFloat(0.9, 1);
        // const scaleMultiplier = 0.6;
        // const scaleMultiplier = 1;
        // const mainAxisDistMultiplier = 1;
        const sideScale = 0.8;
        const mainAxisDistMultiplier = Math.sqrt(THREE.Math.randFloat(0.8, 1));
        const angleScalar = THREE.Math.randFloat(0.9, 1 / 0.9);
        // const maxSideDepth = 1;
        const maxSideDepth = THREE.Math.randInt(0, 3);
        const alwaysSecondary = Math.random() < 0.5 ? true : false;
        const secondaryAxisDistFns: Array<(x: number) => number> = [
            (x) => x * (1 - x),
            (x) => Math.pow(0.2, x),
            (x) => 1 / (1 + x),
        ];
        const fn = secondaryAxisDistFns[THREE.Math.randInt(0, 2)];

        const allLeafNodes = [rootNode];
        let boundary = [rootNode];
        for (let i = 0; i < iterations; i++) {
            const x = i / iterations;
            secondaryAxisDist = fn(x);
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
        this.depthLayers = [];
        this.sideDepthLayers = [];
        for (let i = 0; i < allLeafNodes.length; i++) {
            const leafNode = allLeafNodes[i];
            leafNode.index = i;
            const { depth, sideDepth } = leafNode;
            this.sideDepthLayers[sideDepth] = this.sideDepthLayers[sideDepth] || [];
            this.sideDepthLayers[sideDepth].push(leafNode);
            this.depthLayers[depth] = this.depthLayers[depth] || [];
            this.depthLayers[depth].push(leafNode);
        }
        this.skeleton = new THREE.Skeleton(allLeafNodes);
        this.mesh = this.createMesh(this.skeleton);
        this.add(this.mesh);
    }

    private createMesh(skeleton: THREE.Skeleton) {
        const geometry = new THREE.Geometry();
        for (let i = 0; i < skeleton.bones.length; i++) {
            const leafNode = skeleton.bones[i] as LeafNode;
            const vertex = leafNode.getWorldPosition();
            geometry.vertices.push(vertex);
            geometry.skinIndices.push(new THREE.Vector4(i, 0, 0, 0) as any);
            geometry.skinWeights.push(new THREE.Vector4(1, 0, 0, 0) as any);
        }
        geometry.verticesNeedUpdate = true;
        /* face algorithm
        for each node, create 4 faces:
        1. forward, left, me
        2. forward, me, right
        3. me, left, parent
        4. me, parent, right
         */
        const childFaces = () => {
            for (const leafNode of skeleton.bones as LeafNode[]) {
                const { index, parent, forwardNode, leftNode, rightNode } = leafNode;
                if (forwardNode != null) {
                    if (leftNode != null) {
                        geometry.faces.push(new THREE.Face3(forwardNode.index, leftNode.index, index));
                        if (parent instanceof LeafNode) {
                            geometry.faces.push(new THREE.Face3(index, leftNode.index, parent.index));
                        }
                    }
                    if (rightNode != null) {
                        geometry.faces.push(new THREE.Face3(forwardNode.index, index, rightNode.index));
                        if (parent instanceof LeafNode) {
                            geometry.faces.push(new THREE.Face3(index, parent.index, rightNode.index));
                        }
                    }
                }
            }
        };
        // face algorithm 2:
        // connect siblings in quads
        // for (const layer of this.sideDepthLayers) {
        const cousinFaces = () => {
            for (const layer of this.depthLayers) {
                for (let i = 0; i < layer.length; i++) {
                    const me = layer[i];
                    const { leftNode, forwardNode, rightNode } = me;
                    if (forwardNode != null) {
                        const { leftNode: leftCousin, rightNode: rightCousin } = forwardNode;
                        if (leftNode != null) {
                            geometry.faces.push(new THREE.Face3(me.index, forwardNode.index, leftNode.index));
                            if (leftCousin != null) {
                                geometry.faces.push(new THREE.Face3(leftCousin.index, leftNode.index, forwardNode.index));
                            }
                        }
                        if (rightNode != null) {
                            geometry.faces.push(new THREE.Face3(forwardNode.index, me.index, rightNode.index));
                            if (rightCousin != null) {
                                geometry.faces.push(new THREE.Face3(rightCousin.index, forwardNode.index, rightNode.index));
                            }
                        }
                    }
                }
            }
        };
        // algorithm 3:
        // delauney triangulate
        const delauneyFaces = (maxDepth: number = this.depthLayers.length - 1) => {
            const maxDepthIndex = this.depthLayers[maxDepth][0].index;
            const allLeafNodes = skeleton.bones.slice(0, maxDepthIndex) as LeafNode[];
            try {
                const delaunator = Delaunator.from(allLeafNodes,
                    (bone) => bone.getWorldPosition().x,
                    (bone) => bone.getWorldPosition().z,
                );
                for (let i = 0; i < delaunator.triangles.length; i += 3) {
                    const indexA = delaunator.triangles[i];
                    const indexB = delaunator.triangles[i + 1];
                    const indexC = delaunator.triangles[i + 2];
                    const nodeA = skeleton.bones[indexA] as LeafNode;
                    const nodeB = skeleton.bones[indexB] as LeafNode;
                    const nodeC = skeleton.bones[indexC] as LeafNode;
                    const face = new THREE.Face3(indexA, indexB, indexC);
                    geometry.faces.push(face);
                }
            } catch(e) {
                console.error(e);
                // do nothing
            }
        };

        // delauneyExceptLastDepthFaces();
        /* one of two modes
         * cousin + child builds fan-shaped or compound leaves
         * delauney builds simple Entire edges
        */
        const mode = (Math.random() < 0.5) ? "compound" : "entire";
        if (mode === "compound") {
            childFaces();
            cousinFaces();
        } else {
            // delauneyExceptLastDepthFaces();
            cousinFaces();
            childFaces();
            // delauneyFaces();
        }

        geometry.normalize();
        geometry.scale(0.5, 0.5, 0.5);
        geometry.rotateX(Math.PI);
        geometry.translate(0.5, 0, 0);
        geometry.computeFaceNormals();
        geometry.computeFlatVertexNormals();
        geometry.computeVertexNormals();
        // const mat = new THREE.MeshBasicMaterial({skinning: true, color: "green", side: THREE.DoubleSide});
        const mat = new THREE.MeshLambertMaterial({skinning: true, color: "green", side: THREE.DoubleSide });
        const mesh = new THREE.SkinnedMesh(geometry, mat);
        mesh.add(skeleton.bones[0]);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        mesh.bind(skeleton);

        return mesh;
    }
}
