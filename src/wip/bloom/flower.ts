import * as THREE from "three";

import { Component, ComponentClass } from "./component";
import { LeafOld } from "./leaf/leafOld";
import { Whorl, whorl } from "./whorl";

export class Flower extends Component {
    public constructor(public perianth: Perianth, public reproductive: Reproductive) {
        super();
        this.add(perianth);
        this.add(reproductive);
        const bulb = (() => {
            const geom = new THREE.SphereBufferGeometry(0.05);
            const material = new THREE.MeshLambertMaterial({
                color: 0xffffff,
            });
            return new THREE.Mesh(geom, material);
        })();
        this.add(bulb);
        // for (const child of this.children) {
        //     // hackhack to test performance
        //     child.matrixAutoUpdate = false;
        // }
    }
    static generate() {
        return new Flower(Perianth.generate(), Reproductive.generate());
    }
}

class Perianth extends Component {
    public constructor(public calyx: Calyx, public corolla: Corolla) {
        super();
        this.add(calyx);
        this.add(corolla);
    }
    static generate() {
        return new Perianth(Calyx.generate(), Corolla.generate());
    }
}

class Calyx extends Component {
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
            color: new THREE.Color("rgb(165, 190, 63)"),
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

class Corolla extends Component {
    public constructor(public petals: Whorl<Petal>) {
        super();
        this.add(petals);
    }

    static generate() {
        // // make 5 big ones
        // const parameters = {
        //     num: 5,
        //     startYRot: 0,
        //     endYRot: Math.PI * 2,
        //     startScale: 0.9,
        //     endScale: 0.9,
        //     startZRot: Math.PI / 12,
        //     endZRot: Math.PI / 12,
        //     isBilateral: false,
        //     generate: Petal.generate,
        // };

        // 6 evenly spread
        const parameters = {
            num: 6,
            startYRot: 0,
            endYRot: Math.PI * 2,
            startScale: 1,
            endScale: 1,
            startZRot: Math.PI / 4,
            endZRot: Math.PI / 4,
            isBilateral: false,
            generate: Petal.generate,
        };

        // const parameters = {
        //     num: 63,
        //     startYRot: 0,
        //     endYRot: Math.PI * 8,
        //     startScale: 0.8,
        //     endScale: 0.5,
        //     startZRot: 0,
        //     endZRot: Math.PI / 4,
        //     isBilateral: false,
        //     generate: Petal.generate,
        // };

        const petals = Whorl.generate(parameters);
        return new Corolla(petals);
    }
}

// hack extend Leaf for now
class Petal extends LeafOld {
    constructor() {
        super({
            realtimeDroop: true,
            shapeVertices: (vertex) => {
                const { x, z } = vertex;
                const dist2 = x * x + z * z;
                // const unDroop = dist2 / 1.2 - dist2 * dist2 / 7;

                // nice for those deep blues in the screenshot
                const unDroop = Math.abs(z) / 2;

                // looks good for large yellow broad flowers
                // const unDroop = Math.sqrt(dist2) * 1 - dist2 / 2.45;
                const y = unDroop;
                vertex.x *= 1 - unDroop / 4;
                vertex.z *= 1 - unDroop / 4;
                vertex.y += y;
            },
            shapeGeometry: (geometry) => {
                // TODO scale such that the entire leaf is size 1
                geometry.scale(0.6, 0.6, 0.6);
                // TODO change rotation
                geometry.rotateZ(-Math.PI / 6);
                geometry.scale(1, 1, 0.5);
            },
            noisyEdge: true,
            innerColor: new THREE.Color(0xffffff),
            outerColor: new THREE.Color("rgb(29, 68, 132)"),
            // innerColor: new THREE.Color("rgb(255, 235, 107)"),
            // outerColor: new THREE.Color("rgb(255, 131, 22)"),
            perimeter: LeafOld.leafPerimeter2,
            petioleLength: 0,
        });
    }

    static generate() {
        return new Petal();
    }
}

class Reproductive extends Component {
    public constructor(public androecium: Androecium, public gynoecium: Gynoecium) {
        super();
        this.add(androecium);
        this.add(gynoecium);
    }

    static generate() {
        const gynoecium = null as any;
        return new Reproductive(Androecium.generate(), gynoecium);
    }
}

class Androecium extends Component {
    public constructor(public stamens: Whorl<Stamen>) {
        super();
        this.add(stamens);
    }

    static generate() {
        const stamens = Whorl.generate({
            num: 3,
            endScale: 0.2,
            startScale: 0.5,
            startYRot: 0,
            endYRot: Math.PI,
            startZRot: 0,
            endZRot: 0,
            isBilateral: true,
            generate: Stamen.generate,
        })
        return new Androecium(stamens);
    }
}

class Stamen extends Component {
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
                color: 0xffffff,
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
                color: new THREE.Color("rgb(255, 50, 101)"),
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

class Gynoecium extends Component {
    public constructor(public pistils: Whorl<Pistil>) { super(); }

    static generate() {

    }
}

class Pistil extends Component {
    public constructor(public carpels: Carpel[]) { super(); }
}

class Carpel extends Component {}
