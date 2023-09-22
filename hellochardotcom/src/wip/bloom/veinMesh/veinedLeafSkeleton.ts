import * as THREE from "three";

import { Vein } from "../vein/vein";
import { VeinedLeaf } from "../vein/veinedLeaf";

export class VeinedLeafSkeleton extends THREE.Skeleton {
    public static createFromVeinedLeaf(leaf: VeinedLeaf) {
        if (leaf.normalizationDownScalar == null) {
            throw new Error("VeinedLeaf isn't normalized yet!");
        }
        // veined leaf into skeleton
        // for now, just convert every leaf vein into a bone.
        const baseBone = new THREE.Bone();
        baseBone.visible = false;

        const forwardBone = new THREE.Bone();
        forwardBone.position.x = 1;
        baseBone.add(forwardBone);

        const sideBone = new THREE.Bone();
        sideBone.position.y = 0.1;
        baseBone.add(sideBone);

        const bones: THREE.Bone[] = [baseBone, forwardBone, sideBone];
        return new VeinedLeafSkeleton(leaf, bones);
    }

    private constructor(public leaf: VeinedLeaf, bones: THREE.Bone[]) {
        super(bones);
    }
}
