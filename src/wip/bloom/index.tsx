import * as React from "react";
import * as THREE from "three";

import { LineBasicMaterial } from "three";
import { map } from "../../math";
import { ISketch, SketchAudioContext } from "../../sketch";
import { Component, ComponentClass } from "./component";
import { Flower } from "./flower";
import { LeafOld } from "./leaf/leafOld";
import scene from "./scene";
import { SkinnedLeaf } from "./leaf/skinnedLeaf";
import { Whorl } from "./whorl";

class Branch extends Component {
    public mesh: THREE.Mesh;
    public constructor(public branchLength: number) {
        super();
        const material = new THREE.MeshLambertMaterial({
            color: new THREE.Color("rgb(165, 190, 63)"),
            side: THREE.DoubleSide,
        });
        const numSegments = 5;
        // const geom = new THREE.PlaneGeometry(1, 0.1);
        // const geom = new THREE.BoxBufferGeometry(0.1, branchLength, 0.1);
        const geometry = new THREE.CylinderGeometry(
            0.03,
            0.03,
            branchLength,
            8,
            numSegments,
        );
        const segmentHeight = branchLength / numSegments;
        // for (let i = 0; i < geometry.vertices.length; i++) {
        //     const vertex = geometry.vertices[i];
        //     const y = (vertex.y + branchLength / 2);

        //     // This part will need to be changed depending your skeleton and model
        //     const skinIndex = Math.floor(y / segmentHeight);
        //     const skinWeight = (y % segmentHeight) / segmentHeight;

        //     // Ease between each bone
        //     geometry.skinIndices.push(new THREE.Vector4(skinIndex, skinIndex + 1, 0, 0));
        //     geometry.skinWeights.push(new THREE.Vector4(1 - skinWeight, skinWeight, 0, 0));

        // }

        // geom.rotateX(-Math.PI / 2);
        geometry.translate(0, branchLength / 2, 0);
        this.mesh = new THREE.Mesh(
            geometry,
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
    public constructor(public whorl: Whorl<LeafOld>) {
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
            generate: LeafOld.generate,
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

    public leafMeshes: SkinnedLeaf[] = [];

    public init() {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // this.renderer.setClearColor(new THREE.Color("rgb(193, 255, 251)"));

        this.camera = new THREE.PerspectiveCamera(60, 1 / this.aspectRatio, 0.1, 50);
        this.camera.position.y = 10;
        this.camera.position.z = 10;
        this.camera.position.multiplyScalar(0.1);

        this.orbitControls = new THREE.OrbitControls(this.camera);
        // this.orbitControls.autoRotate = true;
        this.orbitControls.autoRotateSpeed = 0.6;

        this.initComponent();
        // this.scene.add(this.component);

        for (let x = -5; x <= 5; x++) {
            for (let z = -5; z <= 5; z++) {
                const leaf = new SkinnedLeaf();
                // leaf.scale.set(0.9, 0.9, 0.9);
                leaf.position.x = x;
                leaf.position.y = 0.2;
                leaf.position.z = z;
                this.scene.add(leaf);
                this.leafMeshes.push(leaf);
                leaf.scale.set(0.01, 0.01, 0.01);
                // leaf.skeleton.bones[0].scale.set(0.01, 0.01, 0.01);
                // const helper = new THREE.SkeletonHelper(leaf.skeleton.bones[0]);
                // this.scene.add(helper);
            }
        }
        // console.log(leaf.skeleton);

        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));

        // this doesn't work too well
        // const bokehPass = new THREE.BokehPass(this.scene, this.camera, {
        //     focus: 5,
        //     aperture: 0.00025,
        //     maxblur: 0.05,
        //     // width: this.canvas.width,
        //     // height: this.canvas.height,
        // });
        // bokehPass.renderToScreen = true;
        // this.composer.addPass(bokehPass);

        // const ssaoPass = new THREE.SSAOPass( this.scene, this.camera, this.canvas.width, this.canvas.height );
        // // ssaoPass.onlyAO = true;
        // ssaoPass.radius = 8;
        // ssaoPass.aoClamp = 0.2;
        // ssaoPass.lumInfluence = 0.6;
        // this.composer.addPass(ssaoPass);

        // this.renderer.setClearColor(new THREE.Color("rgb("))

        // const saoPass = new THREE.SAOPass( this.scene, this.camera, false, true );
        // saoPass.params.saoBias = 2.6;
        // saoPass.params.saoIntensity = 0.30;
        // saoPass.params.saoScale = 6;
        // saoPass.params.saoKernelRadius = 4;
        // saoPass.params.saoMinResolution = 0;
        // saoPass.params.saoBlur = true;
        // saoPass.params.saoBlurRadius = 16;
        // saoPass.params.saoBlurStdDev = 4;
        // saoPass.params.saoBlurDepthCutoff = 0.05;
        // saoPass.params.output = THREE.SAOPass.OUTPUT.Default;
        // this.composer.addPass(saoPass);

        this.composer.passes[this.composer.passes.length - 1].renderToScreen = true;
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

    logistic(x: number) {
        return 1 / (1 + Math.exp(-x));
    }

    public animate() {
        if (this.component.update != null) {
            this.component.update(this.timeElapsed);
        }
        const leafMeshPos = new THREE.Vector3();
        const boneWorldPos = new THREE.Vector3();

        const x = this.timeElapsed / 1000 - 6;
        const s = this.logistic(x);
        for (const leafMesh of this.leafMeshes) {
            leafMesh.scale.set(s, s, s);
            // leafMesh.rotation.x += 0.01;
            for (const bone of leafMesh.skeleton.bones) {
                // curl the leaves
                // leafMesh.getWorldPosition(leafMeshPos);
                // bone.getWorldPosition(boneWorldPos);
                // const bonePos = boneWorldPos.sub(leafMeshPos);
                const {x, z} = bone.position;
                // bone.rotation.z = 0.02 * Math.sin(this.timeElapsed / 1000) - Math.abs(z) * 1 + Math.abs(x) * 0.18;
                bone.rotation.z += 0.01;

                // bone.rotation.z = Math.sin(Math.abs(z) * 5 + this.timeElapsed / 300) * 0.01;

                // bone.rotation.z += Math.sin(this.timeElapsed / 3000) * 0.05;
            }
        }

        this.orbitControls.update();
        // this.renderer.render(this.scene, this.camera);
        this.composer.render();
    }
}

export default Bloom;
