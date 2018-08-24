import * as THREE from "three";

import dna from "../../dna";
import { Component } from "../component";

const worldScale = new THREE.Vector3();

export class Bud extends Component {
    public growthPercentage = 0;
    private sprouted = false;

    constructor(public eventualSprouts: (bud: Bud) => Component[]) {
        super();
        this.scale.multiplyScalar(dna.growth.childScalar);
    }

    feed(time: number, nutrients: number) {
        this.growthPercentage = Math.min(1, this.growthPercentage + nutrients);

        // if (!this.sprouted && this.growthPercentage > dna.growth.budDevelopmentThreshold) {
        this.getWorldScale(worldScale);
        if (!this.sprouted && worldScale.y > 0.01 && this.growthPercentage > 0.75) {
            this.sprouted = true;
            const sprouts = this.eventualSprouts(this);
            this.add(...sprouts);
        }
    }
}
