import * as THREE from "three";

export class LeafNode extends THREE.Bone {
    // position - position relative to parent.
    // leaves grow in the +x direction - that is the primary vein direction.
    // root leaf node is at 0,0,0.
    // +-z are the secondary vein directions
    // +-y is the curl/waviness direction
    constructor() {
        super(null as any);
        // this.add(new THREE.AxesHelper(0.1));
    }

    private nodeChildren?: LeafNode[];
    public leftNode?: LeafNode;
    public forwardNode?: LeafNode;
    public rightNode?: LeafNode;

    public index!: number;

    public addChildren(mainAxisDist: number, secondaryAxisDist: number, secondaryAxisAngle: number, scale: number) {
        this.nodeChildren = [];
        // maybe don't put a secondary vein going in towards the leaf
        if (this.rotation.y >= 0) {
            const leftNode = this.leftNode = new LeafNode();
            leftNode.position.x = secondaryAxisDist;
            leftNode.position.applyEuler(new THREE.Euler(0, secondaryAxisAngle, 0));
            leftNode.rotation.y = secondaryAxisAngle;
            leftNode.scale.set(scale, scale, scale);
            this.add(leftNode);
            this.nodeChildren.push(leftNode);
        }

        // extend the main axis
        const forwardNode = this.forwardNode = new LeafNode();
        forwardNode.position.x = mainAxisDist;
        forwardNode.scale.set(scale, scale, scale);
        this.add(forwardNode);
        this.nodeChildren.push(forwardNode);

        if (this.rotation.y <= 0) {
            const rightNode = this.rightNode = new LeafNode();
            rightNode.position.x = secondaryAxisDist;
            rightNode.position.applyEuler(new THREE.Euler(0, -secondaryAxisAngle, 0));
            rightNode.rotation.y = -secondaryAxisAngle;
            rightNode.scale.set(scale, scale, scale);
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
    public nodeLayers: LeafNode[][];

    constructor() {
        super();
        const rootNode = new LeafNode();
        // let mainAxisDist = 0.4;
        let mainAxisDist = THREE.Math.randFloat(0.5, 1);
        let secondaryAxisDist = THREE.Math.randFloat(0.5, 1);
        const secondaryAxisAngle = THREE.Math.randFloat(0, Math.PI / 4);
        let scale = THREE.Math.randFloat(0.5, 0.9);
        const allBones = [rootNode];
        let boundary = [rootNode];
        this.nodeLayers = [boundary];
        const iterations = THREE.Math.randInt(2, 5);
        const scaleMultiplier = THREE.Math.randFloat(0.2, 1);
        const mainAxisDistMultiplier = Math.sqrt(THREE.Math.randFloat(0.5, 1));
        const secondaryAxisDistMultiplier = THREE.Math.randFloat(0.5, 1);
        for (let i = 0; i < iterations; i++) {
            const newBoundary: LeafNode[] = [];
            for (const leafNode of boundary) {
                const children = leafNode.addChildren(mainAxisDist, secondaryAxisDist, secondaryAxisAngle, scale);
                newBoundary.push(...children);
            }
            boundary = newBoundary;
            allBones.push(...newBoundary);
            this.nodeLayers.push(newBoundary);
            scale *= scaleMultiplier;
            mainAxisDist *= mainAxisDistMultiplier;
            secondaryAxisDist *= secondaryAxisDistMultiplier;
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
        // face algoirthm 2:
        // for each node layer, except the last, connect siblings together
        geometry.computeFaceNormals();
        const mat = new THREE.MeshBasicMaterial({skinning: true, color: "green", side: THREE.DoubleSide});
        const mesh = new THREE.SkinnedMesh(geometry, mat);
        mesh.add(skeleton.bones[0]);
        mesh.bind(skeleton);
        return mesh;
    }
}
