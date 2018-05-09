import alphaComplex = require("alpha-complex");
import Delaunator from "delaunator";
import * as THREE from "three";

import { VeinedLeaf } from "../vein/veinedLeaf";
import { TextureGenerator, TextureGeneratorParameters } from "./textureGenerator";
import { VeinBone, VeinedLeafSkeleton } from "./veinedLeafSkeleton";

/**
 * A LeafTemplate holds a VeinedLeaf and a geometry and material on top of that veining structure.
 * We use this to share the geometry and material across multiple leaf instances.
 */
export class LeafTemplate {
    public static fromVeinedLeaf(leaf: VeinedLeaf, textureGeneratorParams: TextureGeneratorParameters) {
        // just create a skeleton; we won't bind it
        const skeleton = VeinedLeafSkeleton.createFromVeinedLeaf(leaf);

        const geometry = new THREE.Geometry();
        LeafTemplate.addVerticesAtVeinPositions(geometry, skeleton);

        // alpha too high makes the boundary totally convex and isn't interesting
        // alpha too low puts holes in the leaf where the veins haven't explored into
        // the depth_steps significantly controls the leaf inner whitespace so we factor it
        // while choosing alpha
        const alpha = 1 / skeleton.downScalar / (leaf.growthParameters.DEPTH_STEPS_BEFORE_BRANCHING * 2);
        LeafTemplate.addAlphaHullFaces(alpha, geometry, skeleton);

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        geometry.sortFacesByMaterialIndex();

        const generator = new TextureGenerator(geometry, leaf, skeleton.bones);
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
    private static addVerticesAtVeinPositions(geometry: THREE.Geometry, skeleton: VeinedLeafSkeleton) {
        for (let i = 0; i < skeleton.bones.length; i++) {
            const bone = skeleton.bones[i];
            const vertex = bone.getWorldPosition();
            geometry.vertices.push(vertex);
            geometry.skinIndices.push(new THREE.Vector4(i, 0, 0, 0) as any);
            geometry.skinWeights.push(new THREE.Vector4(1, 0, 0, 0) as any);
        }
        geometry.verticesNeedUpdate = true;
    }

    /**
     * Computes the alpha hull on the geometry and adds each triangle as a Face3 to the geometry.
     */
    private static addAlphaHullFaces(alpha: number, geometry: THREE.Geometry, skeleton: VeinedLeafSkeleton) {
        // const alpha = 10;
        const points = skeleton.bones.map((node) => {
            const {x, z} = node.getWorldPosition();
            return [x, z];
        });
        // this works pretty well, but
        // it makes no connectedness guarantee. some options:
        // * detect, reject (and do this whole thing over) unconnected leaves
        // * in vertex generation, ensure points are no more than e.g. 0.1 units apart
        //   and then set an appropriate alpha here
        const cells = alphaComplex(alpha, points);
        for (let i = 0; i < cells.length; i++) {
            const [indexA, indexB, indexC] = cells[i];
            const a = skeleton.bones[indexA] as VeinBone;
            const b = skeleton.bones[indexB] as VeinBone;
            const c = skeleton.bones[indexC] as VeinBone;
            // const passesFilter = filters.every((filter) => filter(a, b, c));
            // if (passesFilter) {
            const face = new THREE.Face3(indexA, indexB, indexC);
            geometry.faces.push(face);
            // }
        }
    }

    constructor(
        public veinedLeaf: VeinedLeaf,
        public geometry: THREE.Geometry,
        public material: THREE.MeshBasicMaterial,
    ) {}

    public instantiateLeaf() {
        const leaf = new THREE.SkinnedMesh(this.geometry, this.material);
        // create a separate skeleton for each leaf
        const skeleton = VeinedLeafSkeleton.createFromVeinedLeaf(this.veinedLeaf);
        leaf.add(skeleton.rootNode);
        leaf.bind(skeleton);

        // hackhack - our faces are on the wrong side i think and shadows aren't showing through
        leaf.rotation.x = Math.PI;
        leaf.receiveShadow = true;
        leaf.castShadow = true;
        return leaf;
    }
}