import alphaComplex = require("alpha-complex");
import Delaunator from "delaunator";
import * as THREE from "three";

import { VeinedLeaf } from "../vein/veinedLeaf";
import { TextureGenerator, TextureGeneratorParameters } from "./textureGenerator";
import { VeinedLeafSkeleton } from "./veinedLeafSkeleton";

/**
 * A LeafTemplate holds a VeinedLeaf and a geometry and material on top of that veining structure.
 * We use this to share the geometry and material across multiple leaf instances.
 */
export class LeafTemplate {
    public static fromVeinedLeaf(leaf: VeinedLeaf, textureGeneratorParams: TextureGeneratorParameters) {
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

        const materialParams: THREE.MeshPhongMaterialParameters = {
            skinning: true,
            side: THREE.DoubleSide,
            // specular: 0x111111,
            specular: 0x222222,
            // specular: 0x444444,
            // specular: 0xffffff,
            // shininess: 20000,
            shininess: 40,
            // shininess: 0.1,

            bumpScale: 0.04,

            // wireframe: true,
            map: generator.colorMap,
            bumpMap: generator.bumpMap,

            ...textureGeneratorParams.baseMaterialParams,
        };
        const material = new THREE.MeshPhongMaterial(materialParams);

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
            // 1 = forward
            // 2 = orthogonal
            // 3 = forward curl
            // 4 = ortho curl
            const NUM_BONES = 2;
            const startIndex = Math.floor(x * NUM_BONES);
            const endIndex = startIndex + 1;
            const prevIndex = startIndex - 1;
            const weightToNextOne = x - startIndex / NUM_BONES;
            const prevIndexWeight = prevIndex >= 0 ? 0.0 : 0;
            geometry.skinIndices.push(new THREE.Vector4(startIndex, endIndex, -1, -1) as any);
            // geometry.skinWeights.push(new THREE.Vector4(x, Math.abs(z), 0, 0) as any);
            // geometry.skinWeights.push(new THREE.Vector4(Math.pow(x, 4), 0, 0, 0) as any);
            // const forwardWeight = 0; // Math.pow(x, 4);
            // const sideWeight = 0; // Math.pow(Math.abs(z), 4);
            // const forwardCurlWeight = 0; // Math.pow(x, 8);
            // const sideCurlWeight = 0; // Math.pow(Math.abs(z), 4);
            geometry.skinWeights.push(new THREE.Vector4(
                1 - weightToNextOne,
                weightToNextOne,
                prevIndexWeight,
                0,
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
        public material: THREE.MeshBasicMaterial,
    ) {}

    public instantiateLeaf() {
        // const leaf = new THREE.SkinnedMesh(this.geometry, this.material);
        const leaf = new SkinnedMeshHack(this.geometry, this.material);
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
