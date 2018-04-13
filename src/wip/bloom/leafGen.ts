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

    public addChildren(mainAxisDist: number, secondaryAxisDist: number, secondaryAxisAngle: number, scale: number, secondaryScale: number, maxSideDepth: number) {
        this.nodeChildren = [];
        if (this.sideDepth > maxSideDepth) {
            return this.nodeChildren;
        }
        const sideScale = scale * secondaryScale;
        // maybe don't put a secondary vein going in towards the leaf
        //  >= 0;
        if (this.getWorldPosition().z <= 0) {
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

        if (this.getWorldPosition().z >= 0) {
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

export class Leaf2 extends THREE.Object3D {
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
        const secondaryAxisAngle = THREE.Math.randFloat(Math.PI / 12, Math.PI / 4);
        // const secondaryAxisAngle = Math.PI / 2;
        let scale = THREE.Math.randFloat(0.9, 1.0);
        const allBones = [rootNode];
        let boundary = [rootNode];
        this.depthLayers = [boundary];
        this.sideDepthLayers = [boundary];
        // const iterations = THREE.Math.randInt(2, 5);
        const iterations = 3;
        // const scaleMultiplier = THREE.Math.randFloat(0.2, 1);
        // const scaleMultiplier = 0.6;
        const scaleMultiplier = 1;
        const mainAxisDistMultiplier = 1;
        const secondaryAxisDistMultiplier = 1;
        const sideScale = 0.8;
        // const mainAxisDistMultiplier = Math.sqrt(THREE.Math.randFloat(0.5, 1));
        // const secondaryAxisDistMultiplier = THREE.Math.randFloat(0.5, 1);
        const maxSideDepth = 3;
        for (let i = 0; i < iterations; i++) {
            const x = i / iterations;
            secondaryAxisDist = x * (1 - x);
            const newBoundary: LeafNode[] = [];
            for (const leafNode of boundary) {
                const children = leafNode.addChildren(mainAxisDist, secondaryAxisDist, secondaryAxisAngle, scale, sideScale, maxSideDepth);
                newBoundary.push(...children);
            }
            boundary = newBoundary;
            allBones.push(...newBoundary);
            this.depthLayers.push(newBoundary);
            for (const child of newBoundary) {
                const { sideDepth } = child;
                this.sideDepthLayers[sideDepth] = this.sideDepthLayers[sideDepth] || [];
                this.sideDepthLayers[sideDepth].push(child);
            }
            scale *= scaleMultiplier;
            // scale = x * (1 - x);
            // scale = 1;
            mainAxisDist *= mainAxisDistMultiplier;
            // secondaryAxisDist *= secondaryAxisDistMultiplier;
        }
        for (let i = 0; i < allBones.length; i++) {
            allBones[i].index = i;
        }
        this.skeleton = new THREE.Skeleton(allBones);
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
        // for (const leafNode of skeleton.bones as LeafNode[]) {
        //     const { index, parent, forwardNode, leftNode, rightNode } = leafNode;
        //     if (forwardNode != null) {
        //         if (leftNode != null) {
        //             geometry.faces.push(new THREE.Face3(forwardNode.index, leftNode.index, index));
        //             if (parent instanceof LeafNode) {
        //                 geometry.faces.push(new THREE.Face3(index, leftNode.index, parent.index));
        //             }
        //         }
        //         if (rightNode != null) {
        //             geometry.faces.push(new THREE.Face3(forwardNode.index, index, rightNode.index));
        //             if (parent instanceof LeafNode) {
        //                 geometry.faces.push(new THREE.Face3(index, parent.index, rightNode.index));
        //             }
        //         }
        //     }
        // }
        // face algorithm 2:
        // connect siblings in quads
        // for (const layer of this.sideDepthLayers) {
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
                // const siblingParent = sibling.parent;
                // if (parent instanceof LeafNode) {
                //     //  && (siblingParent instanceof LeafNode
                //     const imLeft = me === parent.leftNode;
                //     const forward = parent.forwardNode;
                //     if(
                //     const sibling = imLeft ? parent.forwardNodeleftNode

                //     geometry.faces.push(new THREE.Face3(me.index, sibling.index, parent.index));
                //     // console.log("yes");
                //     // geometry.faces.push(new THREE.Face3(sibling.index, siblingParent.index, parent.index));
                // }
            }
        }
        for (const leafNode of this.depthLayers[this.depthLayers.length - 1]) {
            leafNode.position.y = 0.1;
        }
        // algorithm 3:
        // connect the outer perimeter together
        // the outer perimeter is defined as the nodes in the last layer
        //

        geometry.computeFaceNormals();
        const mat = new THREE.MeshBasicMaterial({skinning: true, color: "green", side: THREE.DoubleSide});
        const mesh = new THREE.SkinnedMesh(geometry, mat);
        mesh.add(skeleton.bones[0]);
        mesh.bind(skeleton);
        return mesh;
    }
}
