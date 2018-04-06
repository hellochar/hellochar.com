import * as React from "react";
import * as THREE from "three";

import { ISketch, SketchAudioContext } from "../../sketch";

abstract class Component {
    object?: THREE.Object3D;
}

class Plant extends Component {
    public constructor(public stem: Stem) { super(); }
}

class Stem extends Component {
    public constructor(public nodes: Nodes) { super(); }
}

class Nodes extends Component {
    public constructor(public rootNode: Node) { super(); }
}

abstract class Node extends Component {
    public constructor(public internode?: Internode) { super(); }
}

class Internode extends Component {
    public constructor(public branch: Branch, public node: Node) { super(); }
}

class Branch extends Component {}

// would be nice to emulate both succulents, and flat leaves, broad, thin, curly.
class Leaves extends Node {
    public constructor(public leaves: Leaf[], internode?: Internode) { super(internode); }
}

class Leaf extends Component {
    public object: THREE.Mesh;
    constructor() {
        super();
        // how do you handle leaf curving?
        const geometry = new THREE.Geometry();
        for (let i = 0; i < 100; i++) {
            const theta = i / 100 * Math.PI * 2;
            const vertex = Leaf.leafPerimeter1(theta);
            geometry.vertices.push(vertex);
        }
        geometry.verticesNeedUpdate = true;
        for (let i = 2; i < 100; i++) {
            const face = new THREE.Face3(0, i - 1, i);
            geometry.faces.push(face);
        }
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
        geometry.mergeVertices();

        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color("rgb(165, 190, 63)"),
        })
        this.object = new THREE.Mesh(
            geometry,
            material,
        );
    }

    static leafPerimeter1 = (theta: number) => {
        const r = (3 + 3 * Math.cos(theta) + 1 / (0.1 + Math.pow(Math.sin(theta / 2), 2))) / 16;
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        return new THREE.Vector3(x, 0, z);
    }
}

class Flower extends Node {
    public constructor(public perianth: Perianth, public reproductive: Reproductive) { super(); }
}

class Perianth extends Component {
    public constructor(public calyx: Calyx, public corolla: Corolla) { super(); }
}

class Calyx extends Component {
    public constructor(public sepals: Whorl<Sepal>) { super(); }
}

class Whorl<T> {
    public constructor(public elements: T[]) {}
}

class Sepal extends Component {}

class Corolla extends Component {
    public constructor(public petals: Whorl<Petal>) { super(); }
}

class Petal extends Component {}

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

class Bloom extends ISketch {
    public scene = new THREE.Scene();
    public camera!: THREE.PerspectiveCamera;
    public orbitControls!: THREE.OrbitControls;

    public init() {
        this.camera = new THREE.PerspectiveCamera(60, 1 / this.aspectRatio, 1, 1000);
        this.camera.position.y = 10;
        this.camera.position.z = 10;
        const geom = new THREE.PlaneGeometry(100, 100);
        geom.rotateX(-Math.PI / 2);
        this.scene.add(new THREE.Mesh(geom));
        this.scene.add(new THREE.AxesHelper(10));
        this.orbitControls = new THREE.OrbitControls(this.camera);
    }

    public animate() {
        this.renderer.render(this.scene, this.camera);
    }
}

export default Bloom;
