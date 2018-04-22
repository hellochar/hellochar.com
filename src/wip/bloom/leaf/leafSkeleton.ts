import * as THREE from "three";
import { Vein } from "../vein/vein";
import { VeinedLeaf } from "../vein/veinedLeaf";

export class LeafNode extends THREE.Bone {
    index!: number;
    constructor(public vein: Vein) {
        super(null as any);
    }

    static createFromVein(vein: Vein) {
        const node = new LeafNode(vein);
        const offset = vein.offset();
        const mag = offset.length();
        node.position.set(mag, 0, 0);

        if (vein.parent != null) {
            const rotation = Math.atan2(offset.y, offset.x);

            const pOffset = vein.parent.offset();
            const parentRotation = Math.atan2(pOffset.y, pOffset.x);

            node.rotateY(rotation - parentRotation);
        }
        // node.position.set(offset.x, 0, offset.y);
        for (const childVein of vein.children) {
            const childNode = LeafNode.createFromVein(childVein);
            node.add(childNode);
        }
        return node;
    }
}

export class LeafSkeleton extends THREE.Skeleton {
    bones!: LeafNode[];
    rootNode: LeafNode;
    constructor(bones: LeafNode[], public downScalar: number) {
        super(bones);
        this.rootNode = bones[0];
    }

    static createFromVeinedLeaf(leaf: VeinedLeaf) {
        const boundingBox = leaf.getBoundingBox();

        // unit square scale the leaf - make all veins fit perfectly in a unit box, maintaining aspect ratio.
        // note that the unit box is probably not min x at 0, it could be e.g. [-0.25, 0.75].
        const scale = 1 / Math.max(
            boundingBox.max.x - boundingBox.min.x,
            boundingBox.max.y - boundingBox.min.y,
        );

        // veined leaf into skeleton
        // for now, just convert every leaf vein into a bone.
        const rootLeafNode = LeafNode.createFromVein(leaf.root);
        const bones: LeafNode[] = [];
        rootLeafNode.traverse((obj) => {
            if (obj instanceof LeafNode) {
                obj.position.multiplyScalar(scale);
                obj.index = bones.length;
                bones.push(obj);
            }
        });

        return new LeafSkeleton(bones, scale);
    }
}
