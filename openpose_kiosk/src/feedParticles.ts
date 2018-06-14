import * as THREE from "three";

import { Noise } from "../../src/common/perlin";

const MAX_POINTS = 10000;

const noiseX = new Noise(0);
const noiseY = new Noise(1);
const noiseZ = new Noise(2);

export class FeedParticles extends THREE.Object3D {
    static material = (() => {
        const starTexture = new THREE.TextureLoader().load("/assets/sketches/disc.png");
        // starTexture.minFilter = THREE.NearestFilter;
        return new THREE.PointsMaterial({
            // blending: THREE.AdditiveBlending,
            depthTest: false,
            depthWrite: false,
            // alphaTest: 0.0,
            color: "green",
            size: 12,
            sizeAttenuation: false,
            map: starTexture,
            opacity: 0.6,
            transparent: true,
        });
    })();

    private geometry = new THREE.BufferGeometry();
    private positions = new Float32Array(MAX_POINTS * 3);

    // time in seconds that this dot has been alive for
    private timeAlive = new Float32Array(MAX_POINTS);
    private points: THREE.Points;

    public numActivePoints = 0;
    public pointsStartIndex = 0;

    private positionsAttribute = new THREE.BufferAttribute(this.positions, 3);

    constructor() {
        super();
        this.geometry.addAttribute('position', this.positionsAttribute);
        this.points = new THREE.Points(this.geometry, FeedParticles.material);
        this.frustumCulled = false;
        this.points.frustumCulled = false;
        this.add(this.points);
    }

    public addPoint(point: THREE.Vector3) {
        if (this.numActivePoints < MAX_POINTS - 1) {
            const modIndex = (this.pointsStartIndex + this.numActivePoints) % MAX_POINTS;
            this.timeAlive[modIndex] = 0;

            const curPositionIndex = modIndex * 3;
            this.positions[curPositionIndex] = point.x;
            this.positions[curPositionIndex + 1] = point.y;
            this.positions[curPositionIndex + 2] = point.z;

            this.numActivePoints++;
        }
    }

    public animate(msElapsed: number) {
        let numDeadPoints = 0;
        let stillCountingDeadPoints = true;

        for (let pIndex = 0; pIndex < this.numActivePoints; pIndex++) {
            const modIndex = (pIndex + this.pointsStartIndex) % MAX_POINTS;
            const positionIndex = (modIndex) * 3;

            const timeAlive = this.timeAlive[modIndex];
            let x = this.positions[positionIndex];
            let y = this.positions[positionIndex + 1];
            let z = this.positions[positionIndex + 2];

            // everything goes towards 0, where the base of the flower is
            // const scalar = 0.99;
            const scalar = 1 - THREE.Math.smootherstep(timeAlive, 0, 4);

            x *= scalar;
            y *= scalar;
            z *= scalar;

            const t = Date.now() / 1000;
            const dx = noiseX.perlin3(t, y * 10, z * 10);
            const dy = noiseY.perlin3(x * 10, t, z * 10);
            const dz = noiseZ.perlin3(x * 10, y * 10, t);

            const noiseScalarFactor = 1 - THREE.Math.smootherstep(timeAlive, 0, 5);

            x += dx * 0.01 * noiseScalarFactor;
            y += dy * 0.01 * noiseScalarFactor;
            z += dz * 0.01 * noiseScalarFactor;

            if (stillCountingDeadPoints) {
                // now, delete points from the start that are "dead"
                // we define "dead" as having reached their goal, which is the base of the flower,
                // which is 0,0,0.
                if (x * x + y * y + z * z < 0.01 * 0.01) {
                    // delete this point
                    numDeadPoints++;
                } else {
                    stillCountingDeadPoints = false;
                }
            }

            this.positions[positionIndex] = x;
            this.positions[positionIndex + 1] = y;
            this.positions[positionIndex + 2] = z;
            this.timeAlive[modIndex] += msElapsed / 1000;
        }
        this.pointsStartIndex = (this.pointsStartIndex + numDeadPoints) % MAX_POINTS;
        this.numActivePoints -= numDeadPoints;
        this.positionsAttribute.needsUpdate = true;
        this.geometry.setDrawRange(this.pointsStartIndex, this.numActivePoints);
        return numDeadPoints;
    }
}
