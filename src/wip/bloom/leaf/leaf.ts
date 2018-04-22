import * as THREE from "three";

import { Component } from "../component";
import { LeafTemplate } from "./leafTemplate";
import { SkinnedLeaf } from "./skinnedLeaf";

// what do I want to say?
// leaf feeds the petiole
// petiole feeds the lamina

export class Leaf extends Component {
    public lamina: SkinnedLeaf;
    constructor(template: LeafTemplate) {
        super();
        const petioleLength = 0.5;
        if (petioleLength > 0) {
            const petiole = (() => {
                // const geom = new THREE.PlaneGeometry(1, 0.1);
                const mat = new THREE.MeshLambertMaterial({
                    color: "green",
                    side: THREE.DoubleSide,
                });
                const geom = new THREE.BoxBufferGeometry(petioleLength, 0.01, 0.04);
                // geom.rotateX(-Math.PI / 2);
                geom.translate(petioleLength / 2, 0, 0);
                const petioleMesh = new THREE.Mesh(
                    geom,
                    mat,
                );
                petioleMesh.castShadow = true;
                petioleMesh.receiveShadow = true;
                return petioleMesh;
            })();
            this.add(petiole);
        }
        this.lamina = new SkinnedLeaf(template);
        this.lamina.position.x = petioleLength;
        this.add(this.lamina);
    }

    logistic(x: number) {
        return 1 / (1 + Math.exp(-x));
    }

    updateSelf(t: number) {
        // const logisticX = (t - this.timeBorn) / 1000 - 6;
        // const s = this.logistic(logisticX);
        const s = 1;
        this.scale.set(s, s, s);
        // leafMesh.rotation.x += 0.01;
        for (const bone of this.lamina.skeleton.bones) {
            // curl the leaves
            const { x, z } = bone.position;
            const len = Math.sqrt(x * x + z * z);
            bone.rotation.z = (0.05 * Math.sin(t / 1000) - Math.abs(z * z) * 50 + Math.abs(x) * 1.38) * len * 5;
        }
    }

    static generate(template: LeafTemplate) {
        return new Leaf(template);
    }
}
