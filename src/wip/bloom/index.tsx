import * as React from "react";
import * as THREE from "three";

import { map } from "../../math";
import { ISketch, SketchAudioContext } from "../../sketch";
import { Component, ComponentClass } from "./component";
import { Flower } from "./flower";
import { Leaf } from "./leaf";
import scene from "./scene";
import { Whorl } from "./whorl";

class Branch extends Component {
    public mesh: THREE.Mesh;
    public constructor(public branchLength: number) {
        super();
        const material = new THREE.MeshLambertMaterial({
            color: new THREE.Color("rgb(165, 190, 63)"),
            side: THREE.DoubleSide,
        });
        // const geom = new THREE.PlaneGeometry(1, 0.1);
        // const geom = new THREE.BoxBufferGeometry(0.1, branchLength, 0.1);
        const geom = new THREE.CylinderBufferGeometry(0.03, 0.03, branchLength);
        // geom.rotateX(-Math.PI / 2);
        geom.translate(0, branchLength / 2, 0);
        this.mesh = new THREE.Mesh(
            geom,
            material,
        );
        this.mesh.castShadow = true;
        this.add(this.mesh);
    }

    public addToEnd(...objects: THREE.Object3D[]) {
        this.add(...objects);
        for (const obj of objects) {
            obj.position.set(0, this.branchLength, 0);
        }
    }

    static generate() {
        return new Branch(10);
    }
}

class Leaves extends Component {
    public constructor(public whorl: Whorl<Leaf>) {
        super();
        this.add(whorl);
    }

    static generate() {
        const whorl = Whorl.generate({
            num: 6,
            startZRot: Math.PI / 6,
            endZRot: Math.PI / 6,
            startYRot: 0,
            endYRot: Math.PI * 2,
            endScale: 0.5,
            startScale: 0.5,
            generate: Leaf.generate,
            isBilateral: false,
        });
        return new Leaves(whorl);
    }
}

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
        this.camera.position.multiplyScalar(0.5);

        this.orbitControls = new THREE.OrbitControls(this.camera);
        this.orbitControls.autoRotate = true;
        this.orbitControls.autoRotateSpeed = 0.6;

        this.initComponent();
        this.scene.add(this.component);

        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
    }

    public initComponent() {
        // this.component = Leaves.generate();
        const branch2 = new Branch(1);
        branch2.addToEnd(Flower.generate());
        const branch = new Branch(3);
        branch.addToEnd(Leaves.generate());
        branch.addToEnd(branch2);
        this.component = branch;

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
