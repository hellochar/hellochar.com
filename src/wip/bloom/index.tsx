import * as React from "react";
import * as THREE from "three";

import { map } from "../../math";
import { ISketch, SketchAudioContext } from "../../sketch";
import { Component, ComponentClass } from "./component";
import { Leaf } from "./leaf";
import scene from "./scene";
import { Whorl } from "./whorl";

class Plant extends Component {
    public constructor(public stem: Stem) { super(); }
    static generate() {
        const stem = Stem.generate();
        return new Plant(stem);
    }
}

class Stem extends Component {
    public constructor(public nodes: Nodes) { super(); }
    static generate() {
        const nodes = Nodes.generate();
        return new Stem(nodes);
    }
}

class Nodes extends Component {
    public constructor(public rootNode: Node) { super(); }
    static generate() {
        // TODO fill in
        return null as any;
    }
}

class Node extends Component {
    public constructor(public internode?: Internode) { super(); }
    static generate(): Node {
        const pick = Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3;
        switch (pick) {
            case 0:
                return Leaves.generate();
            case 1:
                return Flower.generate();
            case 2:
                return new Node(Internode.generate());
            case 3:
                return new Node();
        }
    }
}

class Internode extends Component {
    public constructor(public branch: Branch, public node: Node) {
        super();
        this.add(branch);
        node.position.set(0, branch.branchLength, 0);
        this.add(node);
    }

    static generate() {
        const branch = Branch.generate();
        const node = Node.generate();
        return new Internode(branch, node);
    }
}

class Branch extends Component {
    public mesh: THREE.Mesh;
    public constructor(public branchLength: number) {
        super();
        const material = new THREE.MeshLambertMaterial({
            color: new THREE.Color("rgb(165, 190, 63)"),
            side: THREE.DoubleSide,
        });
        // const geom = new THREE.PlaneGeometry(1, 0.1);
        const geom = new THREE.BoxBufferGeometry(0.1, branchLength, 0.1);
        // geom.rotateX(-Math.PI / 2);
        geom.translate(0, branchLength / 2, 0);
        this.mesh = new THREE.Mesh(
            geom,
            material,
        );
        this.mesh.castShadow = true;
        this.add(this.mesh);
    }

    static generate() {
        return new Branch(10);
    }
}

// would be nice to emulate both succulents, and flat leaves, broad, thin, curly.
class Leaves extends Node {
    public constructor(public whorl: Whorl<Leaf>, internode?: Internode) {
        super(internode);
        this.add(whorl);
    }

    update(time: number) {
        for (const leaf of this.whorl.elements) {
            leaf.update(time);
        }
    }

    static generate() {
        const whorl = Whorl.generate(Leaf);
        return new Leaves(whorl);
        // const internode = (Math.random() < 0.5) ? Internode.generate() : undefined;
        // return new Leaves(whorl, internode);
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
    public scene = scene;
    public camera!: THREE.PerspectiveCamera;
    public orbitControls!: THREE.OrbitControls;
    public composer!: THREE.EffectComposer;

    public component!: Component;

    public init() {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // this.renderer.setClearColor(new THREE.Color("rgb(193, 255, 251)"));

        this.camera = new THREE.PerspectiveCamera(60, 1 / this.aspectRatio, 0.1, 500);
        this.camera.position.y = 10;
        this.camera.position.z = 10;
        this.camera.position.multiplyScalar(0.10);

        this.orbitControls = new THREE.OrbitControls(this.camera);
        this.orbitControls.autoRotate = true;
        this.orbitControls.autoRotateSpeed = 0.6;

        this.initComponent();
        this.scene.add(this.component);

        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
    }

    public initComponent() {
        this.component = Leaves.generate();

        /* test - a center branch, with a leaf coming out of it, and another branch, ending in a flower

        () (3)
        |
        |  _
        | /
        |/ (2)
        |
        | (1)

        ways to represent this:
        Node {
            internode: {
                branch: Branch { length 10 }
                node: Junction {
                    0: Node {
                        internode: {
                            branch: Branch { length 10 },
                            node: Flower
                        }
                    },
                    1: Leaf
                }
            }
        }

        What are the cons here?
            * Nodes are mostly just proxies for Internodes.
            * We need a Junction type
        pros here?
            * it does allow expressing a "flower at the end of a branch"

        what if nodes were just straight up arrays of objects?
            does a "flower at the end" have to be an array of length one?

        what if this was html?
        <flower>
            <branch>
                <leaf /> // terminal node
                <branch>
                <branch>
            <branch>
        </flower>

        what if we took a page from THREEjs and made everything extend Object3D?
            * which has a children array

        yo, what if we just extended Object3D for our objects?

        () (3)
        |
        |  _
        | /
        |/ (2)
        |
        | (1)

        Branch {
            branchLength: 10,
            children: {
                0: leaf,
                1: Branch {
                    branchLength: 10,
                    children: {
                        0: Flower
                    }
                }
            }
        }
        */

        // this.component = new Node(
        //     new Internode(
        //         Branch.generate(),
        //     )
        // )
    }

    public animate() {
        if (this.component.update != null) {
            this.component.update(this.timeElapsed);
        }
        this.orbitControls.update();
        this.renderer.render(this.scene, this.camera);
        // this.composer.render();
    }
}

export default Bloom;
