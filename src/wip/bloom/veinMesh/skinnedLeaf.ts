import * as THREE from "three";

import { VeinedLeafSkeleton } from "./leafSkeleton";
import { LeafTemplate } from "./leafTemplate";

export class SkinnedLeaf extends THREE.SkinnedMesh {

    public skeleton: VeinedLeafSkeleton;
    constructor(template: LeafTemplate) {
        super(template.geometry, template.material);
        // create a separate skeleton for each leaf
        this.skeleton = VeinedLeafSkeleton.createFromVeinedLeaf(template.veinedLeaf);
        this.add(this.skeleton.rootNode);
        this.bind(this.skeleton);

        // hackhack - our faces are on the wrong side i think and shadows aren't showing through
        this.rotation.x = Math.PI;
        this.receiveShadow = true;
        this.castShadow = true;
    }
}
