import * as React from "react";
import * as THREE from "three";

import { ISketch, SketchAudioContext } from "../../sketch";
import { map } from "../../math";

interface ComponentClass<T extends Component> {
    new (...args: any[]): T;
    generate(): T;
}

abstract class Component {
    object?: THREE.Object3D;
    update?(time: number): void;
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
    public object = new THREE.Object3D();
    public constructor(public branch: Branch, public node: Node) {
        super();
        this.object.add(branch.object);
        if (node.object != null) {
            node.object.position.set(0, branch.length, 0);
            this.object.add(node.object);
        }
    }

    static generate() {
        const branch = Branch.generate();
        const node = Node.generate();
        return new Internode(branch, node);
    }
}

class Branch extends Component {
    public object: THREE.Mesh;
    public constructor(public length: number) {
        super();
        const material = new THREE.MeshLambertMaterial({
            color: new THREE.Color("rgb(165, 190, 63)"),
            side: THREE.DoubleSide,
        });
        // const geom = new THREE.PlaneGeometry(1, 0.1);
        const geom = new THREE.BoxBufferGeometry(0.1, length, 0.1);
        // geom.rotateX(-Math.PI / 2);
        geom.translate(0, length / 2, 0);
        const mesh = new THREE.Mesh(
            geom,
            material,
        );
        mesh.castShadow = true;
        this.object = mesh;
    }
    static generate() {
        return new Branch(10);
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

class Leaf extends Component {
    public object: THREE.Object3D;
    public lamina: THREE.Mesh;
    constructor(petioleLength = 0) {
        super();
        this.object = new THREE.Object3D();
        const material = new THREE.MeshLambertMaterial({
            // color: new THREE.Color("rgb(165, 190, 63)"),
            // color: new THREE.Color("rgb(252, 161, 222)"),
            vertexColors: THREE.FaceColors,
            side: THREE.DoubleSide,
            // wireframe: true,
        });
        if (petioleLength > 0) {
            const petiole = (() => {
                // const geom = new THREE.PlaneGeometry(1, 0.1);
                const geom = new THREE.BoxBufferGeometry(petioleLength, 0.01, 0.04);
                // geom.rotateX(-Math.PI / 2);
                geom.translate(petioleLength / 2, 0, 0);
                const mesh = new THREE.Mesh(
                    geom,
                    material,
                );
                mesh.castShadow = true;
                // mesh.receiveShadow = true;
                return mesh;
            })();
            this.object.add(petiole);
        }
        const lamina = this.lamina = (() => {
            // const geometry = new THREE.Geometry();
            const shape = new THREE.Shape();
            shape.moveTo(0, 0);
            for (let i = 0; i < 100; i++) {
                const theta = (i + 50) / 100 * Math.PI * 2;
                // const vertex = Leaf.leafPerimeter1(theta);
                const vertex = Leaf.leafPerimeter2(theta);
                shape.lineTo(vertex.x, vertex.z);
                // geometry.vertices.push(vertex);
            }
            // geometry.colorsNeedUpdate = true;
            // geometry.verticesNeedUpdate = true;
            // for (let i = 2; i < 100; i++) {
            //     const face = new THREE.Face3(0, i - 1, i);
            //     const color = Math.random() < 0.5 ? new THREE.Color(0xffffff) : new THREE.Color("rgb(252, 161, 222)");
            //     face.color = color;
            //     geometry.faces.push(face);
            // }
            // // correct global y offset from the perimeter function
            // const yOffset = geometry.vertices[geometry.vertices.length / 2].y;
            // geometry.translate(0, -yOffset, 0);

            // geometry.computeFaceNormals();
            // geometry.computeVertexNormals();
            // geometry.mergeVertices();

            // const geometry = new THREE.ShapeGeometry(shape, 40);
            const geometry = new THREE.ExtrudeGeometry(shape, {
                curveSegments: 12,
                steps: 1,
                amount: 0.001,
                bevelThickness: 0.005,
                bevelSize: 0.3,
                bevelSegments: 1,
            });
            geometry.rotateX(-Math.PI / 2);
            geometry.translate(0.3 + 0.1, 0, 0); // translate bevelSize
            for (const vertex of geometry.vertices) {
                const { x, z } = vertex;
                const dist2 = x * x + z * z;
                // const unDroop = dist2 / 1.2 - dist2 * dist2 / 7;
                const unDroop = Math.sqrt(dist2) * 1 - dist2 / 2.45;
                const y = unDroop;
                vertex.x *= 1 - unDroop / 2;
                vertex.z *= 1 - unDroop / 2;
                vertex.y += y;
                vertex.x += Math.random() * 0.01 - 0.005;
                vertex.y += Math.random() * 0.01 - 0.005;
                vertex.z += Math.random() * 0.01 - 0.005;
            }
            for (const face of geometry.faces) {
                const {x, y, z} = geometry.vertices[face.c];
                const dist = Math.sqrt(x*x + y*y + z*z);
                const color = new THREE.Color("rgb(135, 27, 32)").lerp(new THREE.Color("rgb(245, 255, 73)"), Math.min(1, dist));
                face.color = color;
            }
            geometry.verticesNeedUpdate = true;
            geometry.scale(0.6, 0.6, 0.6);
            geometry.rotateZ(-Math.PI / 6);
            geometry.computeFaceNormals();
            geometry.computeVertexNormals();
            geometry.mergeVertices();

            const mesh = new THREE.Mesh(
                geometry,
                material,
            );
            // material.wireframe = true;
            mesh.castShadow = true;
            // mesh.receiveShadow = true;
            return mesh;
        })();
        lamina.position.x = petioleLength;
        lamina.position.y = 0.04;
        this.object.add(lamina);
    }

    update(time: number) {
        // const geom = this.lamina.geometry as THREE.Geometry;
        // for (const vertex of geom.vertices) {
        //     const oldY = vertex.y;
        //     const { x, z } = vertex;
        //     const dist2 = x * x + z * z;
        //     const unDroop = dist2 / (1.2 + time * 0.0001) - dist2 * dist2 / 100;
        //     const y = unDroop;
        //     vertex.y = unDroop;
        //     const yDist = y - oldY;
        //     vertex.x *= 1 - yDist / 2;
        //     vertex.z *= 1 - yDist / 2;
        // }
        // geom.verticesNeedUpdate = true;
        // geom.computeVertexNormals();
        // geom.computeFaceNormals();
    }

    // cardate
    static leafPerimeter1 = (theta: number) => {
        const r = (3 + 3 * Math.cos(theta) + 1 / (0.1 + Math.pow(Math.sin(theta / 2), 2))) / 16;

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

    // obovate-ish
    static leafPerimeter2 = (theta: number) => {
        // ranges from -0.4 to +0.6, we want to translate in x +0.4
        const r = (1 + Math.cos(theta) + 4 / (1 + Math.pow(Math.cos(theta - Math.PI / 2), 2))) / 10;
        const x = r * Math.cos(theta) + 0.4;
        const z = r * Math.sin(theta);
        const dist2 = x * x + z * z;
        const unDroop = Math.pow(x, 5);
        const y = unDroop;
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

    static generate<T extends Component>(type: ComponentClass<T>, num: number = 5) {
        const elements: T[] = [];
        const numRotations = 1;
        const startScale = 0.9;
        const endScale = 0.9;
        const startZRot = Math.PI / 12;
        const endZRot = Math.PI / 12;
        const isBilateral = false;
        for (let i = 0; i < num; i++) {
            function create(bilateral = false) {
                const element = type.generate();
                if (element.object != null) {
                    let angle = i / num * Math.PI * 2 * numRotations;
                    if (bilateral) {
                        angle += Math.PI;
                    }
                    // Whorls specifically rotate around the Y axis
                    element.object.rotateY(angle);

                    const zRot = map(i, 0, num, startZRot, endZRot);
                    // Whorls angle elements close to the Y axis
                    element.object.rotateZ(zRot);

                    const scale = map(i, 0, num, startScale, endScale);
                    element.object.scale.set(scale, scale, scale);
                }
                elements.push(element);
                return element;
            }
            create();
            if (isBilateral) {
                create(true);
            }
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

const SHOW_HELPERS = false;

class Bloom extends ISketch {
    public scene = new THREE.Scene();
    public camera!: THREE.PerspectiveCamera;
    public orbitControls!: THREE.OrbitControls;
    public composer!: THREE.EffectComposer;

    public leaves!: Leaves;

    public init() {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // this.renderer.setClearColor(new THREE.Color("rgb(193, 255, 251)"));

        this.camera = new THREE.PerspectiveCamera(60, 1 / this.aspectRatio, 0.1, 500);
        this.camera.position.y = 10;
        this.camera.position.z = 10;
        this.camera.position.multiplyScalar(0.10);
        const groundGeom = new THREE.PlaneGeometry(100, 100, 100, 100);
        groundGeom.rotateX(-Math.PI / 2);
        const ground = new THREE.Mesh(groundGeom, new THREE.MeshLambertMaterial({
            // color: new THREE.Color("rgb(45, 29, 3)"),
            color: new THREE.Color("rgb(220, 220, 231)"),
            dithering: true,
        }));
        ground.receiveShadow = true;
        this.scene.add(ground);
        if (SHOW_HELPERS) {
            this.scene.add(new THREE.AxesHelper(10));
        }
        this.orbitControls = new THREE.OrbitControls(this.camera);
        this.orbitControls.autoRotate = true;
        this.orbitControls.autoRotateSpeed = 0.6;

        const light = new THREE.HemisphereLight("rgb(173, 216, 230)", "rgb(60, 60, 80)", 0.6);
        // const light = new THREE.HemisphereLight("rgb(173, 216, 230)", "rgb(210, 250, 255)", 0.3);
        this.scene.add(light);

        const spotLight = new THREE.SpotLight(
            "rgb(234, 249, 244)",
            1.2,
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

        if (SHOW_HELPERS) {
            const spotLightHelper = new THREE.SpotLightHelper(spotLight);
            this.scene.add(spotLightHelper);

            const shadowCameraHelper = new THREE.CameraHelper(spotLight.shadow.camera);
            this.scene.add(shadowCameraHelper);
        }

        // const leaf = Leaf.generate();
        // this.scene.add(leaf.object);
        this.leaves = Leaves.generate();
        this.scene.add(this.leaves.object);

        const particles = (() => {
            const geom = new THREE.Geometry();
            for (let i = 0; i < 10000; i++) {
                const vertex = new THREE.Vector3(Math.random() * 30 - 15, Math.random() * 30, Math.random() * 30 - 15);
                vertex.multiplyScalar(0.25);
                geom.vertices.push(vertex);
            }
            geom.verticesNeedUpdate = true;
            const points = new THREE.Points(
                geom,
                new THREE.PointsMaterial({
                    color: "rgb(249, 237, 69)",
                    transparent: true,
                    opacity: 0.25,
                    size: 0.01,
                    sizeAttenuation: true,
                }),
            );
            // points.castShadow = true;
            return points;
        })();
        this.scene.add(particles);

        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
    }

    public animate() {
        this.leaves.update(this.timeElapsed);
        this.orbitControls.update();
        this.renderer.render(this.scene, this.camera);
        // this.composer.render();
    }
}

export default Bloom;
