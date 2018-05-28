import * as THREE from "three";

import { Component, ComponentClass } from "../component";

const stamenColor = new THREE.Color(`hsl(${THREE.Math.randInt(180, 360 + 60)}, 100%, ${THREE.Math.randInt(75, 100)}%)`);
const filamentColor = new THREE.Color(`hsl(${THREE.Math.randInt(320, 320 + 200)}, ${THREE.Math.randInt(0, 100)}%, ${THREE.Math.randInt(25, 75)}%)`);

export default class Stamen extends Component {
    filament: THREE.Mesh;
    anther!: THREE.Mesh;

    constructor() {
        super();
        const xDist = 0.2;
        // filament are usually curvy
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(xDist / 5, 0.05, 0),
            new THREE.Vector3(xDist, 0.5, Math.random() * 0.001),
            new THREE.Vector3(xDist * 0.98, 1, Math.random() * 0.001),
        ]);
        this.filament = (() => {
            // TODO probably improve this
            const material = new THREE.MeshLambertMaterial({
                // color: new THREE.Color("rgb(255, 50, 101)"),
                // color: 0xffffff,
                color: filamentColor,
                side: THREE.DoubleSide,
            });
            const geometry = new THREE.TubeBufferGeometry(curve,
                32,
                0.01,
                16,
                false,
            );
            const filament = new THREE.Mesh(
                geometry,
                material,
            );
            return filament;
        })();
        this.add(this.filament);
        this.anther = (() => {
            const geometry = new THREE.SphereGeometry(
                0.08,
                3,
                23,
                0,
                // Math.PI / 3,
                Math.PI * 2,
                0,
                Math.PI,
            );
            geometry.scale(0.8, 1, 0.74);
            const material = new THREE.MeshLambertMaterial({
                // color: new THREE.Color("rgb(255, 50, 101)"),
                color: stamenColor,
                side: THREE.DoubleSide,
            });
            const anther = new THREE.Mesh(
                geometry,
                material,
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
