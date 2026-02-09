import * as THREE from "three";

import { season } from "../../season";
import { Component, ComponentClass } from "../component";

const stamenColor = new THREE.Color(`hsl(${THREE.Math.randInt(180, 360 + 60)}, 100%, ${THREE.Math.randInt(75, 100)}%)`);
const filamentColor = new THREE.Color(`hsl(${THREE.Math.randInt(320, 320 + 200)}, ${THREE.Math.randInt(0, 100)}%, ${THREE.Math.randInt(25, 75)}%)`);

const filamentMaterial = new THREE.MeshLambertMaterial({
    color: filamentColor,
    side: THREE.DoubleSide,
});

const xDist = THREE.Math.randFloat(0, 0.3);
const curveHeight = THREE.Math.randFloat(0.5, 2);
// curvy path for the filament
const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(xDist / 5, 0.05 * curveHeight * THREE.Math.randFloat(0.5, 1.5), 0),
    new THREE.Vector3(xDist, 0.5 * curveHeight * THREE.Math.randFloat(0.8, 1.2), Math.random() * 0.01),
    new THREE.Vector3(xDist * 0.98, curveHeight, Math.random() * 0.01),
]);
const filamentGeometry = new THREE.TubeBufferGeometry(curve,
    32,
    0.01,
    16,
    false,
);

const antherGeometry = new THREE.SphereBufferGeometry(
    0.08,
    3,
    23,
    0,
    // Math.PI / 3,
    Math.PI * 2,
    0,
    Math.PI,
);
antherGeometry.scale(0.8, THREE.Math.randFloat(0.5, 1.1), 0.74);
const cScale = THREE.Math.randFloat(0.5, 1.2);
antherGeometry.scale(cScale, cScale, cScale);
const antherMaterial = new THREE.MeshLambertMaterial({
    color: stamenColor,
    side: THREE.DoubleSide,
});

export default class Stamen extends Component {
    filament: THREE.Mesh;
    anther: THREE.Mesh;

    private growStart = THREE.Math.randFloat(0.3, 0.5);
    private growEnd = THREE.Math.randFloat(this.growStart + 0.1, 0.80);
    private growAntherStart = this.growEnd * THREE.Math.randFloat(0.25, 0.5);
    private growAntherEnd = this.growAntherStart + THREE.Math.randFloat(0.05, 0.1);

    constructor() {
        super();
        this.filament = new THREE.Mesh(
            filamentGeometry,
            filamentMaterial,
        );
        this.add(this.filament);
        this.anther = new THREE.Mesh(
            antherGeometry,
            antherMaterial,
        );
        const filamentEnd = curve.getPoint(1);
        this.anther.position.copy(filamentEnd);
        this.filament.add(this.anther);
    }

    updateSelf(t: number) {
        if (season.type === "growing") {
            this.filament.scale.setScalar(0.001);
            this.anther.scale.setScalar(0.001);
            return;
        }
        if (season.type === "flowering") {
            const scaleFilament = THREE.Math.smootherstep(season.percent, this.growStart, this.growEnd) * 0.99 + 0.01;
            this.filament.scale.setScalar(scaleFilament);

            const scaleAnther = THREE.Math.smootherstep(season.percent, this.growAntherStart, this.growAntherEnd) * 0.99 + 0.01;
            this.anther.scale.setScalar(scaleAnther);
        }
    }

    static generate() {
        return new Stamen();
    }
}
