import * as THREE from "three";

import { Component, ComponentClass } from "./component";
import { Leaf } from "./leaf";
import { Whorl, whorl } from "./whorl";

export class Flower extends Component {
    public constructor(public perianth: Perianth, public reproductive: Reproductive) {
        super();
        this.add(perianth);
        this.add(reproductive);
    }
    static generate() {
        const reproductive = null as any;
        return new Flower(Perianth.generate(), reproductive);
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
    public constructor(public sepals: Whorl<Sepal>) {
        super();
        this.add(sepals);
    }
    static generate() {
        // const sepals = Whorl.generate()
        // TODO fill in
        const sepals = null as any;
        return new Calyx(sepals);
    }
}

class Sepal extends Component {}

class Corolla extends Component {
    public constructor(public petals: Whorl<Petal>) {
        super();
        this.add(petals);
    }

    static generate() {
        // make 5 big ones
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
        // }
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
        }
        const petals = Whorl.generate(parameters);
        return new Corolla(petals);
    }
}

// hack extend Leaf for now
class Petal extends Leaf {
    constructor() {
        super({
            realtimeDroop: true,
            shapeVertices: (vertex) => {
                const { x, z } = vertex;
                const dist2 = x * x + z * z;
                // const unDroop = dist2 / 1.2 - dist2 * dist2 / 7;

                // nice for those deep blues in the screenshot
                const unDroop = dist2 / 1.2 - dist2 * dist2 / 100;

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
            },
            noisyEdge: true,
            innerColor: new THREE.Color(0xffffff),
            outerColor: new THREE.Color("rgb(29, 68, 132)"),
            perimeter: Leaf.leafPerimeter2,
            petioleLength: 0,
        });
    }

    static generate() {
        return new Petal();
    }
}

class Reproductive extends Component {
    public constructor(public androecium: Androecium, public gynoecium: Gynoecium) { super(); }
}

class Androecium extends Component {
    public constructor(public stamens: Whorl<Stamen>) { super(); }
}

class Stamen extends Component {}

class Gynoecium extends Component {
    public constructor(public pistils: Whorl<Pistil>) { super(); }
}

class Pistil extends Component {
    public constructor(public carpels: Carpel[]) { super(); }
}

class Carpel extends Component {}
