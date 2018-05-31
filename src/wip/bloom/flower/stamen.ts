import * as THREE from "three";

import { Component, ComponentClass } from "../component";

const stamenColor = new THREE.Color(`hsl(${THREE.Math.randInt(180, 360 + 60)}, 100%, ${THREE.Math.randInt(75, 100)}%)`);
const filamentColor = new THREE.Color(`hsl(${THREE.Math.randInt(320, 320 + 200)}, ${THREE.Math.randInt(0, 100)}%, ${THREE.Math.randInt(25, 75)}%)`);

const filamentMaterial = new THREE.MeshLambertMaterial({
    // color: new THREE.Color("rgb(255, 50, 101)"),
    // color: 0xffffff,
    color: filamentColor,
    side: THREE.DoubleSide,
});

const xDist = THREE.Math.randFloat(0, 0.3);
const curveHeight = THREE.Math.randFloat(0.5, 1);
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
const antherMaterial = new THREE.MeshLambertMaterial({
    // color: new THREE.Color("rgb(255, 50, 101)"),
    color: stamenColor,
    side: THREE.DoubleSide,
});

export default class Stamen extends Component {
    filament: THREE.Mesh;
    anther!: THREE.Mesh;

    constructor() {
        super();
        // filament are usually curvy
        this.filament = new THREE.Mesh(
            filamentGeometry,
            filamentMaterial,
        );
        this.add(this.filament);
        this.anther = (() => {
            const anther = new THREE.Mesh(
                antherGeometry,
                antherMaterial,
            );
            const filamentEnd = curve.getPoint(1);
            anther.position.copy(filamentEnd);
            return anther;
        })();
        this.add(this.anther);
    }

    static generate() {
        return new Stamen();
    }
}
