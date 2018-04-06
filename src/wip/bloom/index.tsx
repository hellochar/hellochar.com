import * as React from "react";
import * as THREE from "three";

import { ISketch, SketchAudioContext } from "../../sketch";

interface ComponentClass<T extends Component> {
    new (...args: any[]): T;
    generate(): T;
}

abstract class Component {
    object?: THREE.Object3D;
}

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
    public constructor(public branch: Branch, public node: Node) { super(); }
    static generate() {
        const branch = Branch.generate();
        const node = Node.generate();
        return new Internode(branch, node);
    }
}

class Branch extends Component {
    public object: THREE.Mesh;
    public constructor() {
        super();
        // TODO fill in
        const geometry = null as any;
        const material = null as any;
        this.object = new THREE.Mesh(
            geometry,
            material
        );
    }
    static generate() {
        return new Branch();
    }
}

// would be nice to emulate both succulents, and flat leaves, broad, thin, curly.
class Leaves extends Node {
    public object: THREE.Object3D;
    public constructor(public whorl: Whorl<Leaf>, internode?: Internode) {
        super(internode);
        this.object = new THREE.Object3D();
        this.object.add(whorl.object);
    }
    static generate() {
        const whorl = Whorl.generate(Leaf);
        return new Leaves(whorl);
        // const internode = (Math.random() < 0.5) ? Internode.generate() : undefined;
        // return new Leaves(whorl, internode);
    }
}

class Leaf extends Component {
    public object: THREE.Object3D;
    constructor() {
        super();
        const material = new THREE.MeshLambertMaterial({
            color: new THREE.Color("rgb(165, 190, 63)"),
            side: THREE.DoubleSide,
            // wireframe: true,
        });
        const petiole = (() => {
            // const geom = new THREE.PlaneGeometry(1, 0.1);
            const geom = new THREE.BoxBufferGeometry(0.9, 0.01, 0.04);
            // geom.rotateX(-Math.PI / 2);
            geom.translate(0.5, 0, 0);
            const mesh = new THREE.Mesh(
                geom,
                material,
            );
            mesh.castShadow = true;
            // mesh.receiveShadow = true;
            return mesh;
        })();
        const lamina = (() => {
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
            // // correct global y offset from the perimeter function
            // const yOffset = geometry.vertices[geometry.vertices.length / 2].y;
            // geometry.translate(0, -yOffset, 0);

            geometry.computeFaceNormals();
            geometry.computeVertexNormals();
            geometry.mergeVertices();

            const mesh = new THREE.Mesh(
                geometry,
                material,
            );
            mesh.castShadow = true;
            // mesh.receiveShadow = true;
            return mesh;
        })();
        lamina.position.x = 1.0;
        lamina.position.y = 0.04;
        this.object = new THREE.Object3D();
        this.object.add(petiole);
        this.object.add(lamina);
    }

    static leafPerimeter1 = (theta: number) => {
        const r = (3 + 3 * Math.cos(theta) + 1 / (0.1 + Math.pow(Math.sin(theta / 2), 2))) / 16;

        // leaves curl inwards a bit on the near perimeter
        const curl = 0;
        // leaves droop far away
        const droop = r * r;
        const y = -droop;

        // const modifiedR = r - y;
        // const modifiedR = Math.sqrt(1 - y * y);
        const modifiedR = r;
        const x = modifiedR * Math.cos(theta);
        const z = modifiedR * Math.sin(theta);
        return new THREE.Vector3(x, y, z);
    }

    static generate() {
        return new Leaf();
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

class Whorl<T extends Component> extends Component {
    public object: THREE.Object3D;
    public constructor(public elements: T[]) {
        super();
        this.object = new THREE.Object3D();
        for (const el of elements) {
            if (el.object != null) {
                this.object.add(el.object);
            }
        }
    }

    static generate<T extends Component>(type: ComponentClass<T>, num: number = 6, zRot: number = Math.PI / 4) {
        const elements: T[] = [];
        for (let i = 0; i < num; i++) {
            const element = type.generate();
            if (element.object != null) {
                const angle = i / num * Math.PI * 2;
                // Whorl's specifically rotate around the Y axis
                element.object.rotateY(angle);

                // Whorls angle elements towards the Y axis
                element.object.rotateZ(zRot);

                // TODO add other types of whorl placement - scaling, etc.
            }
            elements.push(element);
        }
        return new Whorl(elements);
    }
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
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.camera = new THREE.PerspectiveCamera(60, 1 / this.aspectRatio, 1, 1000);
        this.camera.position.y = 10;
        this.camera.position.z = 10;
        const groundGeom = new THREE.PlaneGeometry(100, 100, 100, 100);
        groundGeom.rotateX(-Math.PI / 2);
        const ground = new THREE.Mesh(groundGeom, new THREE.MeshLambertMaterial({
            color: new THREE.Color("rgb(45, 29, 3)"),
            dithering: true,
        }));
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.scene.add(new THREE.AxesHelper(10));
        this.orbitControls = new THREE.OrbitControls(this.camera);

        const light = new THREE.HemisphereLight("rgb(173, 216, 230)", "rgb(60, 60, 80)", 0.3);
        this.scene.add(light);

        const spotLight = new THREE.SpotLight(
            "rgb(234, 249, 244)",
            1.6,
            200,
            Math.PI / 10,
            1.0,
            1,
        );
        spotLight.position.set(10, 100, 10);

        spotLight.castShadow = true;

        spotLight.shadow.mapSize.width = 2048;
        spotLight.shadow.mapSize.height = 2048;

        spotLight.shadow.camera.near = 50;
        spotLight.shadow.camera.far = 150;
        spotLight.shadow.camera.fov = 10;

        this.scene.add(spotLight);

        const spotLightHelper = new THREE.SpotLightHelper(spotLight);
        this.scene.add(spotLightHelper);

        const shadowCameraHelper = new THREE.CameraHelper(spotLight.shadow.camera);
        this.scene.add(shadowCameraHelper);


        // const leaf = Leaf.generate();
        // this.scene.add(leaf.object);
        const leaves = Leaves.generate();
        this.scene.add(leaves.object);
    }

    public animate() {
        this.renderer.render(this.scene, this.camera);
    }
}

export default Bloom;
