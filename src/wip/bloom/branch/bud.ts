import * as THREE from "three";

import { Component } from "../component";
import dna from "../dna";

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
        const worldScale = this.getWorldScale();
        if (!this.sprouted && worldScale.y > 0.01 && this.growthPercentage > 0.75) {
            this.sprouted = true;
            const sprouts = this.eventualSprouts(this);
            this.add(...sprouts);
        }
    }
}
