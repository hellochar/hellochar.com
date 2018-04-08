import * as React from "react";
import * as THREE from "three";

import { map } from "../../math";
import { ISketch, SketchAudioContext } from "../../sketch";
import { Component, ComponentClass } from "./component";
import { Flower } from "./flower";
import { Leaf } from "./leaf";
import scene from "./scene";
import { Whorl } from "./whorl";
import { LineBasicMaterial } from "three";

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

    public skeleton!: THREE.Skeleton;

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
        // this.scene.add(this.component);

        const branchLength = 5;
        const numSegments = 25;
        const geometry = new THREE.CylinderGeometry(
            0.1,
            0.1,
            branchLength,
            8,
            numSegments,
            true,
        );
        geometry.translate(0, branchLength / 2, 0);
        for (const vertex of geometry.vertices) {
            const boneIndex = Math.floor(map(vertex.y, 0, branchLength, 0, numSegments));
            geometry.skinIndices.push(new THREE.Vector4(boneIndex, 0, 0, 0) as any);
            geometry.skinWeights.push(new THREE.Vector4(1, 0, 0, 0) as any);
        }
        // this creates 48 vertices:
        // y = 0, x8
        // y = 1, x8
        // y = 2, x8
        // y = 3, x8
        // y = 4, x8
        // y = 5, x8
        // we could control this with 5 bones:
        // bone 0, at y = 0
        // bone 1, at y = 1
        // bone 2, at y = 2
        // bone 3, at y = 3
        // bone 4, at y = 4 (note - end of bone 4 controls the y=5 ring)
        // each of these bones is connected to the previous one (that is, .add()-ed),
        // so changes to the first bone propogate to all the rest
        // that's what gives it that magic property.
        // what is each vertex's final position decided by?

        const bones: THREE.Bone[] = [];
        for (let y = 0; y <= numSegments; y++) {
            const bone = new THREE.Bone(null as any);
            if (y > 0) {
                const prevBone = bones[y - 1];
                prevBone.add(bone);
                bone.position.y = branchLength / numSegments;
            }
            bones.push(bone);
        }

        const mat = new THREE.MeshBasicMaterial({skinning: true, color: "green", side: THREE.DoubleSide});
        const mesh = new THREE.SkinnedMesh(geometry, mat);
        mesh.add(bones[0]);
        this.skeleton = new THREE.Skeleton(bones);
        mesh.bind(this.skeleton);
        mesh.rotateZ(-Math.PI / 2);
        // for (const bone of bones) {
        //     bone.rotateY(-0.2);
        // }
        this.scene.add(mesh);
        console.log(this.skeleton);

        const helper = new THREE.SkeletonHelper(bones[0]);
        this.scene.add(helper);

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
        for (let i = 0; i < this.skeleton.bones.length; i++) {
            const bone = this.skeleton.bones[i];
            // bone.rotation.x = 0.02 * i * Math.sin(this.timeElapsed / 200);
            // bone.rotation.z += 0.001;
            // const currentRotation = bone.getWorldRotation().toVector3();
            // const distToUp = currentRotation.angleTo();
            // bone.rotation.x += (Math.random() - 0.5) * 0.01;
            // bone.rotation.y += (Math.random() - 0.5) * 0.01;
            // bone.rotation.z += (Math.random() - 0.5) * 0.01;
            const q = bone.getWorldQuaternion();
            console.log(bone.getWorldRotation());
            // const upQuarternion = new THREE.Quaternion().setFromUnitVectors(currentRotation, new THREE.Vector3(0, 1, 0));
            const upQuarternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0))
            const weight = this.skeleton.bones.length - i;
            const moveAbility = 1 / (weight * weight);
            q.slerp(upQuarternion, 1 + moveAbility * .1);
            bone.quaternion.multiply(q);
            const newRotations = new THREE.Euler().setFromQuaternion(bone.getWorldQuaternion());
            console.log(newRotations);
            // debugger;
            // now q is the world quaternion of what we want;
            // convert that to local
            // const newLocalQuaternion = bone.parent.quaternion.m
            // bone.quaternion.setFromEuler(new THREE.Euler(0, 0, 0));
            // bone.set
            // bone.quaternion.multiplyQuaternions(bone.parent.quaternion, q);
            // bone.setRotationFromQuaternion(q);
        }
        this.orbitControls.update();
        this.renderer.render(this.scene, this.camera);
        // this.composer.render();
    }
}

export default Bloom;
