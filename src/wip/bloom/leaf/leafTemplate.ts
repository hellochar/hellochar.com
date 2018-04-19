import alphaComplex = require("alpha-complex");
import Delaunator from "delaunator";
import * as THREE from "three";

import { LeafGrowthParameters, LeafNode, LeafSkeleton } from "./leafSkeleton";
import { LeafTextureGenerator } from "./textureGen";

export class LeafTemplate {
    constructor(
        public growthParameters: LeafGrowthParameters,
        public geometry: THREE.Geometry,
        public material: THREE.MeshBasicMaterial,
    ) {}

    static fromGrowthParameters(parameters: LeafGrowthParameters) {
        // just create a skeleton; we won't bind it
        const skeleton = LeafSkeleton.grow(parameters);

        const geometry = new THREE.Geometry();
        for (let i = 0; i < skeleton.bones.length; i++) {
            const leafNode = skeleton.bones[i];
            const vertex = leafNode.getWorldPosition();
            geometry.vertices.push(vertex);
            geometry.skinIndices.push(new THREE.Vector4(i, 0, 0, 0) as any);
            geometry.skinWeights.push(new THREE.Vector4(1, 0, 0, 0) as any);
        }
        geometry.verticesNeedUpdate = true;
        /* face algorithm
        for each node, create 4 faces:
        1. forward, left, me
        2. forward, me, right
        3. me, left, parent
        4. me, parent, right
         */
        const childFaces = () => {
            for (const leafNode of skeleton.bones) {
                const { index, parent, forwardNode, leftNode, rightNode } = leafNode;
                if (forwardNode != null) {
                    if (leftNode != null) {
                        geometry.faces.push(new THREE.Face3(forwardNode.index, leftNode.index, index));
                        if (parent instanceof LeafNode) {
                            geometry.faces.push(new THREE.Face3(index, leftNode.index, parent.index));
                        }
                    }
                    if (rightNode != null) {
                        geometry.faces.push(new THREE.Face3(forwardNode.index, index, rightNode.index));
                        if (parent instanceof LeafNode) {
                            geometry.faces.push(new THREE.Face3(index, parent.index, rightNode.index));
                        }
                    }
                }
            }
        };
        // face algorithm 2:
        // connect siblings in quads
        // for (const layer of this.sideDepthLayers) {
        const cousinFaces = () => {
            for (const layer of skeleton.depthLayers) {
                for (let i = 0; i < layer.length; i++) {
                    const me = layer[i];
                    const { leftNode, forwardNode, rightNode } = me;
                    if (forwardNode != null) {
                        const { leftNode: leftCousin, rightNode: rightCousin } = forwardNode;
                        if (leftNode != null) {
                            geometry.faces.push(new THREE.Face3(me.index, forwardNode.index, leftNode.index));
                            if (leftCousin != null) {
                                geometry.faces.push(new THREE.Face3(leftCousin.index, leftNode.index, forwardNode.index));
                            }
                        }
                        if (rightNode != null) {
                            geometry.faces.push(new THREE.Face3(forwardNode.index, me.index, rightNode.index));
                            if (rightCousin != null) {
                                geometry.faces.push(new THREE.Face3(rightCousin.index, forwardNode.index, rightNode.index));
                            }
                        }
                    }
                }
            }
        };
        // algorithm 3:
        // delauney triangulate

        // return true to include/keep
        type Filter = (a: LeafNode, b: LeafNode, c: LeafNode) => boolean;
        const triangleFilters: { [name: string]: Filter } = {
            // filter out faces that are all in the edge layer
            // this produces fascinating edge patterns and a few holes
            // TODO doesn't capture the end bones
            noEdgeLayer: (a, b, c) => !(
                skeleton.edgeLayer.indexOf(a) !== -1 &&
                skeleton.edgeLayer.indexOf(b) !== -1 &&
                skeleton.edgeLayer.indexOf(c) !== -1
            ),
            // filter out faces that are in the edge layer and all 3 don't share a parent.
            noEdgeLayerAndSiblings: (a, b, c) => {
                const aParent = a.parent;
                const bParent = b.parent;
                const cParent = c.parent;
                return !(
                    skeleton.edgeLayer.indexOf(a) !== -1 &&
                    skeleton.edgeLayer.indexOf(b) !== -1 &&
                    skeleton.edgeLayer.indexOf(c) !== -1 &&
                    aParent !== bParent &&
                    bParent !== cParent &&
                    aParent !== cParent
                );
            },
            // filter out very thin faces, usually those are indicative of outer edge craziness
            noThinTriangles: (a, b, c) => {
                const aWorld = a.getWorldPosition();
                const bWorld = b.getWorldPosition();
                const cWorld = c.getWorldPosition();
                const aAngle = bWorld.clone().sub(aWorld).angleTo(cWorld.clone().sub(aWorld));
                const bAngle = aWorld.clone().sub(bWorld).angleTo(cWorld.clone().sub(bWorld));
                const cAngle = bWorld.clone().sub(cWorld).angleTo(aWorld.clone().sub(cWorld));
                const epsilonAngle = Math.PI / 180 * 2;
                return triangleFilters.noEdgeLayer(a, b, c) && (
                    aAngle > epsilonAngle &&
                    bAngle > epsilonAngle &&
                    cAngle > epsilonAngle
                );
            },
            noLongTriangles: (a, b, c) => {
                const longDist = 1;
                const aWorld = a.getWorldPosition();
                const bWorld = b.getWorldPosition();
                const cWorld = c.getWorldPosition();
                return aWorld.distanceTo(bWorld) < longDist
                    && aWorld.distanceTo(cWorld) < longDist
                    && bWorld.distanceTo(cWorld) < longDist;
            },
        };

        const delauneyFaces = (...filters: Filter[]) => {
            const allLeafNodes = skeleton.bones;
            try {
                const delaunator = Delaunator.from(allLeafNodes,
                    (bone) => bone.getWorldPosition().x,
                    (bone) => bone.getWorldPosition().z,
                );
                // for (let i = 0; i < delaunator.halfedges.length; i++) {
                //     const halfEdgeIndex = delaunator.halfedges[i];
                // }
                for (let i = 0; i < delaunator.triangles.length; i += 3) {
                    const indexA = delaunator.triangles[i];
                    const indexB = delaunator.triangles[i + 1];
                    const indexC = delaunator.triangles[i + 2];
                    const a = skeleton.bones[indexA] as LeafNode;
                    const b = skeleton.bones[indexB] as LeafNode;
                    const c = skeleton.bones[indexC] as LeafNode;
                    const passesFilter = filters.every((filter) => filter(a, b, c));
                    if (passesFilter) {
                        const face = new THREE.Face3(indexA, indexB, indexC);
                        geometry.faces.push(face);
                    }
                }
            } catch (e) {
                console.error(e);
                // do nothing
            }
        };

        const alphaHullFaces = () => {
            const alpha = 2;
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
                const a = skeleton.bones[indexA] as LeafNode;
                const b = skeleton.bones[indexB] as LeafNode;
                const c = skeleton.bones[indexC] as LeafNode;
                // const passesFilter = filters.every((filter) => filter(a, b, c));
                // if (passesFilter) {
                const face = new THREE.Face3(indexA, indexB, indexC);
                geometry.faces.push(face);
                // }
            }
        };

        // delauneyExceptLastDepthFaces();
        /* one of two modes
         * cousin + child builds fan-shaped or compound leaves
         * delauney builds simple Entire edges
        */
        // const mode = (Math.random() < 0.33) ? "compound" : Math.random() < 0.5 ? "entire" : "complexEdge";
        const mode = "entire" as any;
        // const mode = "entire";
        // if (mode === "compound") {
        //     childFaces();
        //     cousinFaces();
        // } else if (mode === "entire") {
        //     // delauneyExceptLastDepthFaces();
        //     // cousinFaces();
        //     // childFaces();
        //     delauneyFaces(triangleFilters.noLongTriangles);
        // } else if (mode === "complexEdge") {
        //     delauneyFaces(triangleFilters.noEdgeLayerAndSiblings, triangleFilters.noThinTriangles);
        // }
        alphaHullFaces();

        geometry.computeFaceNormals();
        geometry.computeFlatVertexNormals();
        geometry.computeVertexNormals();

        geometry.computeBoundingBox();

        const generator = new LeafTextureGenerator(geometry, skeleton.depthLayers, skeleton.bones);
        generator.updateGeometryFaceVertexUvs();
        generator.generateAndDrawMaps();

        const material = new THREE.MeshPhongMaterial({
            skinning: true,
            side: THREE.DoubleSide,
            map: generator.colorMap,
            // specular: 0x111111,
            // specular: 0x222222,
            specular: 0x444444,
            // specular: 0xffffff,
            // shininess: 20000,
            shininess: 8,
            // shininess: 0.1,
            bumpMap: generator.bumpMap,
            bumpScale: 0.04,
            // wireframe: true,
        });

        return new LeafTemplate(parameters, geometry, material);
    }
}
