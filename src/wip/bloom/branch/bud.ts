import * as THREE from "three";

import { Component } from "../component";
import dna from "../dna";

export class Bud extends Component {
    public growthPercentage = 0;
    private sprouted = false;
    public sproutPercentage = 0.25;

    static geom = (() => {
        const g = new THREE.SphereBufferGeometry(0.06, 5, 7);
        g.scale(0.8, 1.2, 0.8);
        return g;
    })();

    public sphere: THREE.Mesh;

    constructor(public eventualSprouts: () => Component[]) {
        super();
        this.sphere = new THREE.Mesh(Bud.geom, dna.branchTemplate.material);
        // this.add(this.sphere);
        this.scale.multiplyScalar(dna.growth.childScalar);
    }

    feed(time: number, nutrients: number) {
        this.growthPercentage = Math.min(1, this.growthPercentage + nutrients);
        if (!this.sprouted && this.growthPercentage > dna.growth.budDevelopmentThreshold) {
            this.sprouted = true;
            const sprouts = this.eventualSprouts();
            this.add(...sprouts);
        }
    }
}
