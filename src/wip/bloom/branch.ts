import * as THREE from "three";

import { Component } from "./component";
import { Flower } from "./flower";
import Leaves from "./leaf/leaves";

export class Branch extends Component {
    public mesh: THREE.SkinnedMesh;
    public skeleton: THREE.Skeleton;

    public constructor(public finalBranchLength: number) {
        super();
        const numSegments = 10 * finalBranchLength;
        // const geom = new THREE.PlaneGeometry(1, 0.1);
        // const geom = new THREE.BoxBufferGeometry(0.1, branchLength, 0.1);
        const geometry = new THREE.CylinderGeometry(
            0.03,
            0.03,
            finalBranchLength,
            3,
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

        // // test bone children
        // const testGeom = new THREE.SphereBufferGeometry(0.03);
        // const testMat = new THREE.MeshPhongMaterial();

        const bones: THREE.Bone[] = [];

        for (let y = 0; y <= numSegments; y++) {
            const bone = new THREE.Bone(null as any);
            if (y > 0) {
                const prevBone = bones[y - 1];
                prevBone.add(bone);
                bone.position.y = finalBranchLength / numSegments;
            }
            bones.push(bone);

            // bone.rotation.x = (Math.random() * Math.PI * 2);

            // const mesh = new THREE.Mesh(testGeom, testMat);
            // mesh.position.x = 0.1;
            // bone.add(mesh);
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
        // this.skeleton.bones[0].add(new THREE.AxesHelper(1));
    }

    public addToEnd(...objects: THREE.Object3D[]) {
        this.add(...objects);
        for (const obj of objects) {
            obj.position.set(0, this.finalBranchLength, 0);
        }
    }

    private flower?: Flower;

    private createFlower() {
        return Flower.generate();
    }

    private createBranch(newBranchLength: number) {
        const branch = new Branch(newBranchLength);
        const randYDir = Math.random() * Math.PI * 2;
        branch.skeleton.bones[0].rotateZ(-Math.PI / 2);
        return branch;
    }

    private addChildAtPoint(child: Component, bone: THREE.Bone) {
        // where do I add it? How do I ensure it continues on the skeleton?
        // 1) add to me, set position and rotation manually
        // 2) maybe add to Bone as a child?
        // this.add(child);
        child.rotateY(Math.PI * 2 * Math.random());
        bone.add(child);

        // const childPosition = bone.getWorldPosition().sub(this.getWorldPosition());
        // child.position.copy(childPosition);

        // const childScale = bone.getWorldScale();
        // // child.skeleton.bones[0].scale.copy(childScale);
        // child.scale.copy(childScale);
        // child.scale.multiplyScalar(0.5);
        // this.add(child);
    }

    updateSelf(t: number) {
        const { bones } = this.skeleton;
        // this should grow 1 segment per second
        const growthFactor = 246 / 1000;
        const curveUpwardsAmount = 1.01;
        const boneShrinkFactor = 0.98;
        const bonesPerGrowth = 10;

        // grow branches
        let endIndex = bones.findIndex((b) => b.scale.x < boneShrinkFactor);
        if (endIndex === -1) {
            endIndex = bones.length - 1;
        }
        const currentBone = bones[endIndex];
        if (endIndex !== bones.length - 1) {
            const scale = currentBone.scale.x;
            const newScale = Math.min(boneShrinkFactor, scale + growthFactor);
            currentBone.scale.set(newScale, newScale, newScale);
            // currentBone.rotation.z += 0.1 * Math.sin(t / 700);

            const q = currentBone.getWorldQuaternion();
            // console.log(bone.getWorldRotation());
            // const upQuarternion = new THREE.Quaternion().setFromUnitVectors(currentRotation, new THREE.Vector3(0, 1, 0));
            const upQuarternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0))
            // this slerp factor largely determines the shape of the branch - how curvy it is
            q.slerp(upQuarternion, curveUpwardsAmount);
            currentBone.quaternion.multiply(q);
        } else if (this.flower == null) {
            // we've grown all the way! grow a flower at the end.
            const flower = this.flower = this.createFlower();
            this.addChildAtPoint(this.flower, currentBone);
        }

        // grow another thing here
        if (endIndex % bonesPerGrowth === (bonesPerGrowth - 1) && currentBone.scale.x >= boneShrinkFactor) {
            const currentLength = THREE.Math.mapLinear(endIndex, 0, bones.length, 0, this.finalBranchLength);
            const newBranchLength = this.finalBranchLength - currentLength;
            if (newBranchLength > 1) {
                const height = currentBone.getWorldPosition().y;
                const growthPercentage = currentLength / this.finalBranchLength;
                if (Math.random() > growthPercentage) {
                    const branch = this.createBranch(newBranchLength);
                    this.addChildAtPoint(branch, currentBone);
                    branch.scale.multiplyScalar(0.8);
                }
                const leaves = Leaves.generate();
                this.addChildAtPoint(leaves, currentBone);
                leaves.scale.multiplyScalar(0.7);
            }
        }

        for (let i = 0; i < endIndex; i++) {
            const bone = bones[i];
            // bone.rotation.y += 0.001;
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

            bone.rotation.x = 0.002 * Math.sin((t - this.timeBorn) / 200);
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
            // const weight = endIndex - i;
            // reachTowardsUp(0.02 / (weight * weight));
        }
    }

    static generate() {
        return new Branch(10);
    }
}
