import alphaComplex = require("alpha-complex");
import Delaunator from "delaunator";
import * as THREE from "three";

import { VeinedLeaf } from "../vein/veinedLeaf";
import { TextureGenerator, TextureGeneratorParameters } from "./textureGenerator";
import { VeinedLeafSkeleton } from "./veinedLeafSkeleton";

export const LEAF_NUM_BONES = 5;

/**
 * A LeafTemplate holds a VeinedLeaf and a geometry and material on top of that veining structure.
 * We use this to share the geometry and material across multiple leaf instances.
 */
export class LeafTemplate {
    public static fromVeinedLeaf(leaf: VeinedLeaf, textureGeneratorParams: TextureGeneratorParameters, envMap: THREE.CubeTexture) {
        // just create a skeleton; we won't bind it
        const skeleton = VeinedLeafSkeleton.createFromVeinedLeaf(leaf);

        const geometry = new THREE.Geometry();
        LeafTemplate.addVerticesAndSkinningAtVeinPositions(leaf, geometry);

        // alpha too high makes the boundary totally convex and isn't interesting
        // alpha too low puts holes in the leaf where the veins haven't explored into
        // the depth_steps significantly controls the leaf inner whitespace so we factor it
        // while choosing alpha
        const alpha = leaf.growthParameters.EXPAND_DIST / (leaf.growthParameters.DEPTH_STEPS_BEFORE_BRANCHING * 2);
        LeafTemplate.addAlphaHullFaces(alpha, leaf, geometry);

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        geometry.sortFacesByMaterialIndex();

        const generator = new TextureGenerator(geometry, leaf);
        generator.updateGeometryFaceVertexUvs();
        generator.generateAndDrawMaps(textureGeneratorParams);

        // const materialParams: THREE.MeshPhongMaterialParameters = {
        //     skinning: true,
        //     side: THREE.DoubleSide,
        //     // specular: 0x111111,
        //     specular: 0x222222,
        //     // specular: 0x444444,
        //     // specular: 0xffffff,
        //     // shininess: 20000,
        //     shininess: 40,
        //     // shininess: 0.1,

        //     bumpScale: 0.04,

        //     // wireframe: true,
        //     map: generator.colorMap,
        //     bumpMap: generator.bumpMap,

        //     ...textureGeneratorParams.baseMaterialParams,
        // };
        // const material = new THREE.MeshPhongMaterial(materialParams);
        const materialParams: THREE.MeshStandardMaterialParameters = {
            skinning: true,
            side: THREE.DoubleSide,
            bumpScale: 0.04,
            map: generator.colorMap,
            bumpMap: generator.bumpMap,
            envMap,
            ...textureGeneratorParams.baseMaterialParams,
        };
        const material = new THREE.MeshStandardMaterial(materialParams);

        return new LeafTemplate(leaf, geometry, material);
    }

    /**
     * Adds one vertex to the geometry for each vein in the VeinedLeafSkeleton.
     * Also attaches skinIndices/skinWeights corresponding to that bone.
     */
    private static addVerticesAndSkinningAtVeinPositions(leaf: VeinedLeaf, geometry: THREE.Geometry) {
        for (let i = 0; i < leaf.world.length; i++) {
            const { x, y: z } = leaf.world[i].normalizedPosition;
            geometry.vertices.push(new THREE.Vector3(x, 0, z));
            // bone array goes like this:
            // [baseBone, forwardBones x5, sideBone]
            const prevIndex = Math.floor(x * LEAF_NUM_BONES);
            const nextIndex = prevIndex + 1;
            const secondIndex = prevIndex + 2;
            const orthoIndex = LEAF_NUM_BONES + 1;
            // this is still not perfect - there are discontinuities.
            // quadratic bezier: (1-t)[(1-t)P0 +tP1] + t[(1-t)P1 + tP2]
            // P0 is prevBone
            // P1 is nextBone
            // P2 is secondBone
            // expanded out we get
            // (1-t)^2P0 + 2t(1-t)P1 + t^2(P2)
            const t = x - prevIndex / LEAF_NUM_BONES; // ranges from 0 to 1; this is "t"

            const prevBoneWeight = (1 - t) * (1 - t);
            const nextBoneWeight = 2 * t * (1 - t);
            let secondBoneWeight = t * t;
            // we're at the last segment of the forward bones; don't overstep.
            if (secondIndex >= orthoIndex) {
                secondBoneWeight = 0;
            }

            const orthoWeight = Math.abs(z) * 10.;

            geometry.skinIndices.push(new THREE.Vector4(prevIndex, nextIndex, secondIndex, orthoIndex) as any);
            // geometry.skinWeights.push(new THREE.Vector4(x, Math.abs(z), 0, 0) as any);
            // geometry.skinWeights.push(new THREE.Vector4(Math.pow(x, 4), 0, 0, 0) as any);
            // const forwardWeight = 0; // Math.pow(x, 4);
            // const sideWeight = 0; // Math.pow(Math.abs(z), 4);
            // const forwardCurlWeight = 0; // Math.pow(x, 8);
            // const sideCurlWeight = 0; // Math.pow(Math.abs(z), 4);
            geometry.skinWeights.push(new THREE.Vector4(
                prevBoneWeight,
                nextBoneWeight,
                secondBoneWeight,
                orthoWeight,
                // forwardWeight,
                // sideWeight,
                // forwardCurlWeight,
                // sideCurlWeight,
            ) as any);
        }
        geometry.verticesNeedUpdate = true;
    }

    /**
     * Computes the alpha hull on the geometry and adds each triangle as a Face3 to the geometry.
     */
    private static addAlphaHullFaces(alpha: number, leaf: VeinedLeaf, geometry: THREE.Geometry) {
        const points = leaf.world.map((vein) => {
            const { x, y } = vein.position;
            return [x, y];
        });
        const cells = alphaComplex(alpha, points);
        for (let i = 0; i < cells.length; i++) {
            const [indexA, indexB, indexC] = cells[i];
            const face = new THREE.Face3(indexA, indexB, indexC);
            geometry.faces.push(face);
        }
    }

    constructor(
        public veinedLeaf: VeinedLeaf,
        public geometry: THREE.Geometry,
        public material: THREE.Material,
    ) {}

    public instantiateLeaf() {
        // const leaf = new THREE.SkinnedMesh(this.geometry, this.material as THREE.MeshBasicMaterial);
        // HACK the typings; the typings are too restrictive and don't allow generic THREE.Material
        const leaf = new SkinnedMeshHack(this.geometry, this.material as THREE.MeshBasicMaterial);
        // create a separate skeleton for each leaf
        const skeleton = VeinedLeafSkeleton.createFromVeinedLeaf(this.veinedLeaf);
        leaf.add(skeleton.bones[0]);
        leaf.bind(skeleton);

        // hackhack - our faces are on the wrong side i think and shadows aren't showing through
        leaf.rotation.x = Math.PI;
        leaf.receiveShadow = true;
        leaf.castShadow = true;
        return leaf;
    }
}

/**
 * Custom subclass of SkinnedMesh that prevents normalizing skin weights.
 * We intentionally use un-normalized skin weights so that a single bone can control the curl
 * of the entire leaf.
 * THREE.SkinnedMesh's constructor always calls normalizeSkinWeights(), which we don't want to do,
 * so we hack around it by overriding the method.
 */
class SkinnedMeshHack extends THREE.SkinnedMesh {
    normalizeSkinWeights() {
        // do nothing! lol
    }
}
