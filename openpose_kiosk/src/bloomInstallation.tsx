import * as $ from "jquery";
import * as React from "react";
import * as THREE from "three";

import { Bloom } from "../../src/wip/bloom";
import { NUTRIENT_PER_SECOND } from "../../src/wip/bloom/components/branch";
import { dna } from "../../src/wip/bloom/dna";
import { FeedParticles } from "./feedParticles";
import { OpenPoseManager } from "./openPoseManager";
import { PersonMesh } from "./personMesh";

export class BloomInstallation extends Bloom {
    public openPoseManager!: OpenPoseManager;
    public peopleMeshes: PersonMesh[] = [];
    public feedParticles!: FeedParticles;

    public init() {
        this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
        super.init();
        this.openPoseManager = new OpenPoseManager();
        const branchColor = dna.branchTemplate.material.color;
        FeedParticles.material.color = branchColor;
        FeedParticles.material.needsUpdate = true;

        for (let i = 0; i < 12; i++) {
            const personMesh = new PersonMesh(i);
            this.peopleMeshes[i] = personMesh;
            personMesh.position.z = -1.5;
            this.camera.add(personMesh);
        }

        this.feedParticles = new FeedParticles();
        this.scene.add(this.feedParticles);
    }

    public animate(ms: number) {
        try {
            this.updatePersonMeshes();
        } catch {}

        let numFeedParticles = 0;
        try {
            numFeedParticles = this.feedParticles.animate(ms);
        } catch {}

        const nutrientsPerSecond = Math.min(9.9, 0.17 + Math.sqrt(numFeedParticles) / 5);
        NUTRIENT_PER_SECOND.value = nutrientsPerSecond;
        super.animate(ms);
    }

    private updatePersonMeshes() {
        const people = this.openPoseManager.getLatestFramePeople();
        for (const personMesh of this.peopleMeshes) {
            const maybePerson = people[personMesh.index];
            personMesh.updateFromOpenPosePerson(maybePerson);

            if (this.season.type !== "dying") {
                if (maybePerson != null) {
                    const p = new THREE.Vector3();
                    for (const keypointSphere of personMesh.keypointSpheres) {
                        const keypoint = keypointSphere.keypoint;
                        if (keypoint.confidence > 0) {
                            // this is anywhere from 1e-10, (or 0), to 0.001 at max lol
                            const maxVel = 0.05;
                            const vel = keypoint.offset.length();
                            const probability = vel / maxVel - 0.1; // bias against total stillness
                            if (Math.random() < probability) {
                                p.copy(keypointSphere.position);
                                personMesh.localToWorld(p);
                                this.feedParticles.addPoint(p);
                            }
                        }
                    }
                }
            } else {
                // shrink personMeshes in dying season
                const scale = Math.max(0.01,
                    THREE.Math.mapLinear(this.season.percent, 0, 0.5, 1, 0.01),
                );
                if (scale <= 0.01 && personMesh.parent != null) {
                    personMesh.parent.remove(personMesh);
                } else {
                    personMesh.scale.x = scale;
                    personMesh.scale.y = scale;
                }
            }
        }
    }
    public resize(width: number, height: number) {
        super.resize(width, height);
        this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    }
}
