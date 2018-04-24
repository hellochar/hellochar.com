import * as THREE from "three";

import { Component, ComponentClass } from "../component";

export default class Calyx extends Component {
    public constructor() {
        super();

        const elements: THREE.Vector2[] = [];
        for (let i = 0; i < 128; i++) {
            const theta = i / 128 * Math.PI * 2;
            const pt = Calyx.perimeter1(theta);
            elements.push(pt);
        }
        const shape = new THREE.Shape(elements);
        // const curve = new (class extends THREE.Curve<THREE.Vector3> {
        //     getPoint(t: number, optionalTarget?: THREE.Vector3) {
        //         const theta = t * Math.PI * 2;
        //         return Sepal.sepalPerimeter1(theta);
        //     }
        // })();
        const geom = new THREE.ExtrudeGeometry(shape, {
            steps: 1,
            amount: 0.01,
            bevelEnabled: true,
            bevelThickness: 0.025,
            bevelSize: 0.05,
            bevelSegments: 1,
        });
        geom.rotateX(-Math.PI / 2);
        geom.scale(0.25, 0.25, 0.25);
        for (const vertex of geom.vertices) {
            const {x, y, z} = vertex;
            const r2 = x * x + z * z;
            vertex.y += r2 / 2 - 0.025;
        }
        // geom.scale(0.25, 0.25, 0.25);
        geom.verticesNeedUpdate = true;
        const mat = new THREE.MeshLambertMaterial({
            color: new THREE.Color("darkgreen"),
        });
        const mesh = new THREE.Mesh(geom, mat);
        this.add(mesh);
    }
    static generate() {
        return new Calyx();
    }

    static perimeter1 = (theta: number) => {
        const tendrilAmount = 0.3;
        const numPetals = 12;
        const tendrilSharp = 0.5; // >1 = sharp, 0 - 1 = fat
        const r = 1 - tendrilAmount + tendrilAmount * Math.pow(Math.abs(Math.cos(theta / 2 * numPetals)), tendrilSharp);
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        // return new THREE.Vector3(x, 0, z);
        return new THREE.Vector2(x, z);
    }

}
