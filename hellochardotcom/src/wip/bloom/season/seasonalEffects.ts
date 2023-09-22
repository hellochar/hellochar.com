import * as THREE from "three";

import { Bloom } from "../bloom";
import { Branch } from "../components/branch";
import { Bud } from "../components/branch/bud";
import { Component } from "../components/component";
import dna from "../dna";
import { season } from "./season";

export interface SeasonalEffect {
    update(): void;
}

export class GrowingSeasonalEffect implements SeasonalEffect {
    update() {

    }
}

export class FloweringSeasonalEffect implements SeasonalEffect {
    constructor(public bloom: Bloom) {}
    update() {
        const rotSpeedScalar = Math.max(
            Math.pow(season.percent, 6) * 1 / (1 + Math.exp(300 * (season.percent - 0.98))) - 0.01,
            0,
        );
        this.bloom.scene.particles.rotateY(0.4 * rotSpeedScalar);
        this.bloom.scene.particles.material.opacity = rotSpeedScalar + 0.2;
    }
}

export class DyingSeasonalEffect implements SeasonalEffect {
    private deathSchedules: Map<Component, number> = new Map();
    private originalColor: THREE.Color;
    private targetColor = new THREE.Color("brown");

    constructor(public bloom: Bloom) {
        this.originalColor = dna.branchTemplate.material.color.clone();

        // fill in death schedules
        this.bloom.component!.traverse((obj) => {
            // add everything but the root
            if (obj instanceof Component && !(obj instanceof Branch) && !(obj instanceof Bud)) {
                // sqrt(deathTime) makes *everything* die right at the end
                // deathTime*deathTime makes *everything* die right at the start
                // deathTime puts things a bit too much at the start
                // so do pow(, 0.8) for a slight curve
                const deathTime = Math.pow(Math.random(), 0.8) * 0.8;

                this.deathSchedules.set(obj, deathTime);
            }
        });
    }

    update() {
        // find any new ones that need to be scheduled
        const percent = season.percent;
        for (const [component, deathTime] of this.deathSchedules) {
            if (percent > deathTime) {
                // if (component.children.length === 0) {
                    // we can kill it
                this.bloom.triggerDeath(component);
                this.deathSchedules.delete(component);
                // break;
                // } else {
                    // you have dependents; wait a second

                // }
            }
        }
        const wantedBranchColor = this.originalColor.clone().lerp(this.targetColor, percent);
        dna.branchTemplate.material.color = wantedBranchColor;
        dna.branchTemplate.material.needsUpdate = true;
    }
}
