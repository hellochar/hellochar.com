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
    public static fromVeinedLeaf(leaf: VeinedLeaf, textureGeneratorParams: TextureGeneratorParameters, envMap: THREE.CubeTexture) {
        // just create a skeleton; we won't bind it
        const skeleton = VeinedLeafSkeleton.createFromVeinedLeaf(leaf);

        const geometry = new THREE.Geometry();
        LeafTemplate.addVerticesAndSkinningAtVeinPositions(leaf, geometry);

        // alpha too high makes the boundary totally convex and isn't interesting
        // alpha too low puts holes in the leaf where the veins haven't explored into
        // the depth_steps significantly controls the leaf inner whitespace so we factor it
        // while choosing alpha
        const alpha = leaf.growthParameters.EXPAND_DIST / (leaf.growthParameters.DEPTH_STEPS_BEFORE_BRANCHING * 1.5);
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
            const vein = leaf.world[i];
            const cost = Math.min(1, vein.costToRoot / leaf.growthParameters.MAX_PATH_COST);
            const { x, y: z } = vein.normalizedPosition;
            const yCup = x * (1 - x) * leaf.growthParameters.yCupAmount;
            const yLift = -Math.tanh(Math.abs(z * leaf.growthParameters.yLiftFrequency)) * leaf.growthParameters.yLiftAmount;
            const yNoise = THREE.Math.randFloat(-1, 1) * 0.002;
            // const yFray = Math.pow(cost, 6) * 0.05 * Math.cos((x * 9 + Math.abs(z) * 9) * (1 - x) * 12);
            const yFray = Math.pow(cost, 8) * leaf.growthParameters.yFrayScale * Math.cos(vein.distanceToRoot / 2 / vein.depth);
            const y = yCup + yLift + yNoise + yFray;
            // const y = 0;
            geometry.vertices.push(new THREE.Vector3(x, y, z));
            // bone array goes like this:
            // [baseBone, forwardBones x5, sideBone]
            const prevIndex = Math.floor(x);
            const nextIndex = Math.ceil(x);
            const t = x - prevIndex;

            const orthoIndex = 2;

            const orthoWeight = Math.abs(z * z);
            // const orthoWeight = 0;

            geometry.skinIndices.push(new THREE.Vector4(prevIndex, nextIndex, -1, orthoIndex) as any);
            geometry.skinWeights.push(new THREE.Vector4(
                1 - t,
                t,
                0,
                orthoWeight,
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
        const leaf = new SkinnedMeshLeaf(this.geometry, this.material as THREE.MeshBasicMaterial);
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
class SkinnedMeshLeaf extends THREE.SkinnedMesh {
    normalizeSkinWeights() {
        // do nothing! lol
    }
}
