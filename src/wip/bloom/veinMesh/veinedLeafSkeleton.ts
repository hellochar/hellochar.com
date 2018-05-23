import * as THREE from "three";

import { Vein } from "../vein/vein";
import { VeinedLeaf } from "../vein/veinedLeaf";
import { LEAF_NUM_BONES } from "./leafTemplate";

export class VeinedLeafSkeleton extends THREE.Skeleton {
    public static createFromVeinedLeaf(leaf: VeinedLeaf) {
        if (leaf.normalizationDownScalar == null) {
            throw new Error("VeinedLeaf isn't normalized yet!");
        }
        // veined leaf into skeleton
        // for now, just convert every leaf vein into a bone.
        const baseBone = new THREE.Bone(null as any);
        const bones: THREE.Bone[] = [baseBone];
        let bone = baseBone;
        for (let i = 0; i < LEAF_NUM_BONES; i++) {
            const newBone = new THREE.Bone(null as any);
            newBone.position.x = 1 / LEAF_NUM_BONES;
            bone.add(newBone);
            bone = newBone;
            bones.push(bone);
        }
        // const forwardBone = new THREE.Bone(null as any);
        // forwardBone.position.x = 1 / 3;
        const sideBone = new THREE.Bone(null as any);
        sideBone.position.z = 1;
        sideBone.rotation.y = Math.PI / 2;
        baseBone.add(sideBone);

        // const forwardCurlBone = new THREE.Bone(null as any);
        // forwardCurlBone.position.x = 0.1;
        // forwardBone.add(forwardCurlBone);

        // const sideCurlBone = new THREE.Bone(null as any);
        // sideCurlBone.position.z = 0.1;
        // sideBone.add(sideCurlBone);

        // const bones = [baseBone, forwardBone, sideBone, forwardCurlBone, sideCurlBone];
        // const bones = [baseBone, forwardBone];
        return new VeinedLeafSkeleton(leaf, bones);
    }

    private constructor(public leaf: VeinedLeaf, bones: THREE.Bone[]) {
        super(bones);
    }
}
