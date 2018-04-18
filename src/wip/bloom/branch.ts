import * as THREE from "three";

import { Component } from "./component";
import { Flower } from "./flower";
import Leaves from "./leaf/leaves";

export class Branch extends Component {
    public mesh: THREE.SkinnedMesh;
    public skeleton: THREE.Skeleton;

    public constructor(public finalBranchLength: number) {
        super();
        this.add(new THREE.AxesHelper(1));
        const numSegments = 10 * finalBranchLength;
        // const geom = new THREE.PlaneGeometry(1, 0.1);
        // const geom = new THREE.BoxBufferGeometry(0.1, branchLength, 0.1);
        const geometry = new THREE.CylinderGeometry(
            0.03,
            0.03,
            finalBranchLength,
            8,
            numSegments,
            true,
        );
        geometry.translate(0, finalBranchLength / 2, 0);
        const segmentHeight = finalBranchLength / numSegments;
        for (const vertex of geometry.vertices) {
            const boneIndex = Math.floor(THREE.Math.mapLinear(vertex.y, 0, finalBranchLength, 0, numSegments));
            geometry.skinIndices.push(new THREE.Vector4(boneIndex, 0, 0, 0) as any);
            geometry.skinWeights.push(new THREE.Vector4(1, 0, 0, 0) as any);
        }

        // test bone children
        const testGeom = new THREE.SphereBufferGeometry(0.03);
        const testMat = new THREE.MeshPhongMaterial();

        const bones: THREE.Bone[] = [];

        for (let y = 0; y <= numSegments; y++) {
            const bone = new THREE.Bone(null as any);
            if (y > 0) {
                const prevBone = bones[y - 1];
                prevBone.add(bone);
                bone.position.y = finalBranchLength / numSegments;
            }
            bones.push(bone);
            const mesh = new THREE.Mesh(testGeom, testMat);
            mesh.position.x = 0.1;
            // bone.rotation.x = (Math.random() * Math.PI * 2);
            bone.add(mesh);
        }

        const material = new THREE.MeshLambertMaterial({ skinning: true, color: "green", side: THREE.DoubleSide });
        this.mesh = new THREE.SkinnedMesh(
            geometry,
            material,
        );
        this.mesh.castShadow = true;

        this.mesh.add(bones[0]);
        this.skeleton = new THREE.Skeleton(bones);
        this.mesh.bind(this.skeleton);
        this.add(this.mesh);
        for (const bone of bones) {
            bone.scale.set(0.1, 0.1, 0.1);
            // bone.rotation.y = Math.random() * Math.PI * 2;
            // bone.rotation.z = 0.2;
        }
        // this.rotateZ(-Math.PI / 2);
        this.skeleton.bones[0].rotation.z = -Math.PI / 2;
    }

    public addToEnd(...objects: THREE.Object3D[]) {
        this.add(...objects);
        for (const obj of objects) {
            obj.position.set(0, this.finalBranchLength, 0);
        }
    }

    private flower?: Flower;

    private addFlower() {
        const flower = this.flower = Flower.generate();
        const lastBone = this.skeleton.bones[this.skeleton.bones.length - 1];
        const pos = lastBone.getWorldPosition().sub(this.getWorldPosition());
        flower.position.copy(pos);

        const childScale = lastBone.getWorldScale();
        flower.scale.copy(childScale);
        flower.scale.multiplyScalar(0.8);
        this.add(flower);
    }

    private createBranch(newBranchLength: number) {
        const branch = new Branch(newBranchLength);
        const randYDir = Math.random() * Math.PI * 2;
        // branch.skeleton.bones[0].rotation.y = randYDir;
        // branch.skeleton.bones[0].rotation.z = -Math.PI / 3;
        // currentBone.rotation.z += Math.PI / 12;
        // child.rotateZ(-Math.PI / 2);
        return branch;
    }

    private addChildAtPoint(child: Component, bone: THREE.Bone) {
        // where do I add it? How do I ensure it continues on the skeleton?
        // 1) add to me, set position and rotation manually
        // 2) maybe add to Bone as a child?
        // this.add(child);
        // currentBone.add(child);

        const childPosition = bone.getWorldPosition().sub(this.getWorldPosition());
        child.position.copy(childPosition);

        const childScale = bone.getWorldScale();
        // child.skeleton.bones[0].scale.copy(childScale);
        child.scale.copy(childScale);
        child.scale.multiplyScalar(0.5);
        this.add(child);
    }

    updateSelf(t: number) {
        const { bones } = this.skeleton;
        // this should grow 1 segment per second
        const growthFactor = 36 / 1000;

        // grow branches
        let endIndex = bones.findIndex((b) => b.scale.x < 0.95);
        if (endIndex === -1) {
            endIndex = bones.length - 1;
        }
        const currentBone = bones[endIndex];
        if (currentBone != null) {
            const scale = currentBone.scale.x;
            const newScale = Math.min(1, scale + growthFactor);
            currentBone.scale.set(newScale, newScale, newScale);
            // currentBone.rotation.z += 0.1 * Math.sin(t / 700);

            const q = currentBone.getWorldQuaternion();
            // console.log(bone.getWorldRotation());
            // const upQuarternion = new THREE.Quaternion().setFromUnitVectors(currentRotation, new THREE.Vector3(0, 1, 0));
            const upQuarternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0))
            // this slerp factor largely determines the shape of the branch - how curvy it is
            q.slerp(upQuarternion, 1.02);
            currentBone.quaternion.multiply(q);
        } else if (this.flower == null) {
            // // wow we've grown all the way! maybe grow a bud at the end or something
            // this.addFlower();
        }

        // add another leaf whorl
        if (endIndex % 20 === 19 && currentBone.scale.x >= 0.95) {
            const currentLength = THREE.Math.mapLinear(endIndex, 0, bones.length, 0, this.finalBranchLength);
            const newBranchLength = this.finalBranchLength - currentLength;
            if (newBranchLength > 1) {
                let child: Component;
                if (Math.random() < 1.5) {
                    child = this.createBranch(newBranchLength);
                } else {
                    child = Leaves.generate();
                }
                this.addChildAtPoint(child, currentBone);
            }
        }

        for (let i = 0; i < endIndex; i++) {
            const bone = bones[i];
            bone.rotation.y += 0.001;
            function wobble() {
                const wobbleAmount = THREE.Math.clamp(
                    THREE.Math.mapLinear(i, endIndex - 10, endIndex, 0, 1),
                    0,
                    1,
                );
                // const wobbleAmount = Math.pow(i / endIndex, 3);
                // const wobbleAmount = i / endIndex;
                bone.rotation.z = 0.008 * wobbleAmount * Math.sin(t / 5000);
                bone.rotation.x = 0.003 * wobbleAmount * Math.cos(t / 5000);
            }
            // wobble();

            // bone.rotation.x = 0.02 * i * Math.sin(this.timeElapsed / 200);
            // bone.rotation.z += 0.001;

            function randomizeRotation() {
                bone.rotation.x += (Math.random() - 0.5) * 0.01;
                bone.rotation.y += (Math.random() - 0.5) * 0.01;
                bone.rotation.z += (Math.random() - 0.5) * 0.01;
            }

            function reachTowardsUp(moveAbility: number) {
                // TODO this is taxing on performance maybe?
                const q = bone.getWorldQuaternion();
                // console.log(bone.getWorldRotation());
                // this is up because the default of the geometry (with absolutely no rotation of any sort) is facing up
                const upQuarternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
                q.slerp(upQuarternion, 1 + moveAbility);
                bone.quaternion.multiply(q);
            }
            const weight = endIndex - i;
            reachTowardsUp(0.02 / (weight * weight));
        }
    }

    static generate() {
        return new Branch(10);
    }
}
