import * as THREE from "three";

import { VeinedLeafSkeleton } from "../vein/leafSkeleton";
import { LeafTemplate } from "./leafTemplate";

export class SkinnedLeaf extends THREE.SkinnedMesh {

    public skeleton: VeinedLeafSkeleton;
    constructor(template: LeafTemplate) {
        super(template.geometry, template.material);
        this.skeleton = VeinedLeafSkeleton.createFromVeinedLeaf(template.veinedLeaf);
        this.add(this.skeleton.rootNode);
        this.bind(this.skeleton);

        // const boundingBox = this.geometry.boundingBox;
        // const xScale = 1 / (boundingBox.max.x - boundingBox.min.x);
        // // const mesh2 = new THREE.SkinnedMesh(geometry, new THREE.MeshBasicMaterial({color: "darkgreen", transparent: true, opacity: 0.2, wireframe: true, side: THREE.DoubleSide}));
        // // mesh.add(mesh2);
        // // mesh2.bind(skeleton);

        // // mesh.scale is used to normalize the leaf x length
        // this.scale.set(xScale, xScale, xScale);

        // hackhack - our faces are on the wrong side i think and shadows aren't showing through
        this.rotation.x = Math.PI;
        this.receiveShadow = true;
        this.castShadow = true;
    }
}
