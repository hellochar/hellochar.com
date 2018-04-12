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
    public centerNode?: LeafNode;
    public rightNode?: LeafNode;

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
        const centerNode = this.centerNode = new LeafNode();
        centerNode.position.x = mainAxisDist;
        centerNode.scale.set(scale, scale, scale);
        this.add(centerNode);
        this.nodeChildren.push(centerNode);

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
        let mainAxisDist = 0.4;
        const secondaryAxisDist = 0.1;
        const secondaryAxisAngle = Math.PI / 6;
        let scale = 0.8;
        const allBones = [rootNode];
        let boundary = [rootNode];
        this.nodeLayers = [boundary];
        const iterations = 4;
        for (let i = 0; i < iterations; i++) {
            const newBoundary: LeafNode[] = [];
            for (const leafNode of boundary) {
                const children = leafNode.addChildren(mainAxisDist, secondaryAxisDist, secondaryAxisAngle, scale);
                newBoundary.push(...children);
            }
            boundary = newBoundary;
            allBones.push(...newBoundary);
            this.nodeLayers.push(newBoundary);
            // scale *= 0.8;
            // mainAxisDist *= 0.5;
        }
        this.skeleton = new THREE.Skeleton(allBones);
        this.mesh = this.createMesh(this.skeleton);
        this.add(this.mesh);
    }

    private createMesh(skeleton: THREE.Skeleton) {
        const geometry = new THREE.Geometry();
        for (let i = 0; i < skeleton.bones.length; i++) {
            const leafNode = skeleton.bones[i];
            geometry.vertices.push(new THREE.Vector3());
            geometry.skinIndices.push(new THREE.Vector4(i) as any);
            geometry.skinWeights.push(new THREE.Vector4(1) as any);
        }
        geometry.verticesNeedUpdate = true;
        // face algorithm
        // for each
        const mat = new THREE.MeshBasicMaterial({skinning: true, color: "green", side: THREE.DoubleSide});
        const mesh = new THREE.SkinnedMesh(geometry, mat);
        mesh.add(skeleton.bones[0]);
        mesh.bind(skeleton);
        return mesh;
    }
}
