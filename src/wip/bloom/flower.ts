import * as THREE from "three";

import { Component, ComponentClass } from "./component";
import { dna } from "./dna";
import { LeafOld } from "./leaf/leafOld";
import { Whorl } from "./whorl";

export class Flower extends Component {
    public constructor(public perianth: Perianth, public reproductive: Reproductive) {
        super();
        this.add(perianth);
        this.add(reproductive);
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

class Corolla extends Component {
    public constructor(public petals: Whorl<Petal>) {
        super();
        this.add(petals);
    }

    static generate() {
        const petals = Whorl.generate(dna.petalWhorlTemplate);
        return new Corolla(petals);
    }
}

// hack extend Leaf for now
export class Petal extends LeafOld {
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
            innerColor: dna.colors.petalInnerColor,
            outerColor: dna.colors.petalOuterColor,
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
        const gynoecium = Gynoecium.generate();
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
    public constructor(public carpels: Whorl<Carpel>) {
        super();
        this.add(carpels);
    }

    static generate() {
        // const whorl = Whorl.generate({
        //     num: 1,
        //     startScale: 1,
        //     endScale: 1,
        //     startYRot: 0,
        //     endYRot: 0,
        //     startZRot: Math.PI / 2,
        //     endZRot: Math.PI / 2,
        //     generate: Carpel.generate,
        //     isBilateral: false,
        // });
        const whorl = new Whorl([Carpel.generate()]);
        return new Gynoecium(whorl);
    }
}

class Carpel extends Component {
    static ovaryMeshTemplate = (() => {
        const geom = new THREE.SphereBufferGeometry(0.05);
        const material = new THREE.MeshLambertMaterial({
            color: "darkgreen",
        });
        const mesh = new THREE.Mesh(geom, material);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        return mesh;
    })();

    static styleMeshTemplate = (() => {
        const styleHeight = 0.5;
        const geom = new THREE.CylinderGeometry(1, 1, styleHeight, 20, 20);
        geom.translate(0, styleHeight / 2, 0);
        for (const vertex of geom.vertices) {
            const y = THREE.Math.mapLinear(vertex.y, 0, styleHeight, 0, 1);
            const r =
                0.005
                + 0.04 * 2 / (1 + Math.exp(20 * y * y))
                + 0.005 * 2 / (1 + Math.exp(20 * (1 - y)));
            vertex.x *= r;
            vertex.z *= r;
        }
        geom.verticesNeedUpdate = true;
        const material = new THREE.MeshLambertMaterial({
            // TODO better random color
            color: "white",
        });
        const mesh = new THREE.Mesh(geom, material);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        return mesh;
    })();

    static stigmaMeshTemplate = (() => {
        // take a sphere and then depress it
        const geom = new THREE.SphereGeometry(0.02, 80, 20);
        geom.scale(1, 0.3, 1);
        for (const vertex of geom.vertices) {
            // normalize it into the unit sphere
            const x = THREE.Math.mapLinear(vertex.x, 0, 0.02, 0, 1);
            const z = THREE.Math.mapLinear(vertex.z, 0, 0.02, 0, 1);
            const dist2FromYAxis = x * x + z * z;
            const yTranslate =
                -0.005 * 2 / (1 + Math.exp(15 * dist2FromYAxis))
                - 0.005 * 2 / (1 + Math.exp(5 * (1 - dist2FromYAxis)))
            const yAngle = Math.atan2(z, x);
            // const rScale = (1 + 1.0 * Math.pow(Math.cos(yAngle / 2 * 3), 2)) / 2;
            const rScale = 1;
            vertex.x *= rScale;
            vertex.z *= rScale;
            vertex.y += yTranslate;
        }
        geom.verticesNeedUpdate = true;
        geom.computeFaceNormals();
        geom.computeVertexNormals();
        const material = new THREE.MeshLambertMaterial({
            color: "white",
        });
        const mesh = new THREE.Mesh(geom, material);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        return mesh;
    })();

    public ovary: (typeof Carpel)["ovaryMeshTemplate"];
    public style: (typeof Carpel)["styleMeshTemplate"];
    public stigma: (typeof Carpel)["stigmaMeshTemplate"];

    constructor() {
        super();
        this.ovary = Carpel.ovaryMeshTemplate.clone();
        this.add(this.ovary);
        this.style = Carpel.styleMeshTemplate.clone();
        this.ovary.add(this.style);
        this.stigma = Carpel.stigmaMeshTemplate.clone();
        this.style.add(this.stigma);
        this.stigma.position.y = 0.5 + 0.005;
    }
    static generate() {
        return new Carpel();
    }
}
