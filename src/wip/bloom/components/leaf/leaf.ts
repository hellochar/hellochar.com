import * as THREE from "three";

import lazy from "../../../../common/lazy";
import { logistic } from "../../../../math";
import { simulateVeinBoneGravity } from "../../physics";
import { season } from "../../season";
import { LeafTemplate } from "../../veinMesh/leafTemplate";
import { Component } from "../component";

// const petioleLength = Math.random() < 0.5 ? 0 : THREE.Math.randFloat(0.1, 0.5);
const petioleLength = 0.0;

const leafScalar = Math.pow(2, THREE.Math.randFloat(-1, 0)) - Math.random() * Math.random() * THREE.Math.randFloat(-1, 1) * 0.2;

const leafStiffness = Math.pow(10, THREE.Math.randFloat(-2, -1));

export class Leaf extends Component {
    static petioleMaterial = lazy(() => new THREE.MeshLambertMaterial({
        color: "green",
        side: THREE.DoubleSide,
    }));

    static petioleGeometry = lazy(() => {
        const geom = new THREE.CylinderBufferGeometry(0.02, 0.012, 1);
        geom.rotateZ(Math.PI / 2);
        geom.translate(0.5, 0, 0);
        return geom;
    });

    public growthPercentage = 0;

    public lamina: THREE.SkinnedMesh;
    constructor(template: LeafTemplate) {
        super();
        this.frustumCulled = false;
        if (petioleLength > 0) {
            const petiole = (() => {
                const petioleMesh = new THREE.Mesh(
                    Leaf.petioleGeometry(),
                    Leaf.petioleMaterial(),
                );
                petioleMesh.castShadow = true;
                petioleMesh.receiveShadow = true;
                petioleMesh.matrixAutoUpdate = false;
                petioleMesh.scale.setScalar(petioleLength);
                petioleMesh.updateMatrix();
                return petioleMesh;
            })();
            this.add(petiole);
        }
        this.lamina = template.instantiateLeaf();
        this.lamina.position.x = petioleLength * 0.98;
        this.lamina.scale.multiplyScalar(leafScalar);
        // this.lamina.position.y = 0.0015;
        this.add(this.lamina);
    }

    updateSelf(t: number) {
        const msAlive = t - this.timeBorn;
        const logisticX = msAlive / 500 - 6;
        // const logisticX = msAlive / 50 - 6;
        const s = logistic(logisticX);
        this.growthPercentage = s;
        this.scale.set(s, s, s);

        const [...bones] = this.lamina.skeleton.bones;
        let stiffness = THREE.Math.mapLinear(Math.sin(msAlive / 5000), -1, 1, 0, leafStiffness);
        if (season.type === "dying") {
            stiffness *= 1 - season.percent;
        }
        for (const bone of bones) {
            simulateVeinBoneGravity(bone, stiffness);
        }
    }

    static generate(template: LeafTemplate) {
        return new Leaf(template);
    }
}
