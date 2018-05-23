import * as THREE from "three";

import { Branch } from "./branch";
import { BranchBone, BranchSkeleton } from "./branchBone";

/**
 * Has a big effect on perf. More bones = more objects to matrixWorldUpdate, but also smoother curves.
 */
export const BONES_PER_UNIT_LENGTH = 10;

const BRANCH_MATERIAL = new THREE.MeshLambertMaterial({ skinning: true, color: "green", side: THREE.DoubleSide });

export class BranchMeshManager {
    public mesh: THREE.SkinnedMesh;
    public skeleton: BranchSkeleton;

    constructor(public branch: Branch) {
        const { finalBranchLength } = branch;
        // initialize the geometry, material, skeleton, and skinnedmesh
        const numSegments = BONES_PER_UNIT_LENGTH * branch.finalBranchLength;
        /*
         * The cylinder's upwards is pointed at +y. The cylinder ranges in y from [0, finalBranchLength].
         */
        const geometry = new THREE.CylinderGeometry(
            0.03,
            0.03,
            finalBranchLength,
            5,
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

        const bones: BranchBone[] = [];

        for (let y = 0; y <= numSegments; y++) {
            const bone = new BranchBone(bones.length, branch);
            if (y > 0) {
                const prevBone = bones[y - 1];
                prevBone.add(bone);
                bone.position.y = finalBranchLength / numSegments;
            }
            bones.push(bone);
        }

        this.mesh = new THREE.SkinnedMesh(
            geometry,
            BRANCH_MATERIAL,
        );
        this.mesh.castShadow = true;

        this.mesh.add(bones[0]);
        this.skeleton = new BranchSkeleton(bones);
        this.mesh.bind(this.skeleton);

        // now we've computed inverses; update view.
        for (const bone of bones) {
            bone.updateView();
        }
        // this.skeleton.bones[0].add(new THREE.AxesHelper(1));
    }
}
