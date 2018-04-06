import * as React from "react";
import * as THREE from "three";

import { ISketch, SketchAudioContext } from "../../sketch";

class Plant {
    public constructor(public stem: Stem) {}
}

class Stem {
    public constructor(public nodes: Nodes) {}
}

class Nodes {
    public constructor(public rootNode: Node) {}
}

abstract class Node {
    public constructor(public internode?: Internode) {}
}

class Internode {
    public constructor(public branch: Branch, public node: Node) {}
}

class Branch {}

// would be nice to emulate both succulents, and flat leaves, broad, thin, curly.
class Leaves extends Node {
    public constructor(public leaves: Leaf[], internode?: Internode) { super(internode); }
}

class Leaf {}

class Flower extends Node {
    public constructor(public perianth: Perianth, public reproductive: Reproductive) { super(); }
}

class Perianth {
    public constructor(public calyx: Calyx, public corolla: Corolla) {}
}

class Calyx {
    public constructor(public sepals: Whorl<Sepal>) {}
}

class Whorl<T> {
    public constructor(public elements: T[]) {}
}

class Sepal {}

class Corolla {
    public constructor(public petals: Whorl<Petal>) {}
}

class Petal {}

class Reproductive {
    public constructor(public androecium: Androecium, public gynoecium: Gynoecium) {}
}

class Androecium {
    public constructor(public stamens: Whorl<Stamen>) {}
}

class Stamen {}

class Gynoecium {
    public constructor(public pistils: Whorl<Pistil>) {}
}

class Pistil {
    public constructor(public carpels: Carpel[]) {}
}

class Carpel {}

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
