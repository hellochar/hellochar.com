import * as THREE from "three";

import { Branch } from "../branch";
import { Flower, Petal } from "../flower";
import { Leaf } from "../leaf";
import { generatePetalGrowthParameters, generateRandomVeinedLeaf, generateVeinGrowthParameters } from "../vein/veinedLeaf";
import { LeafTemplate } from "../veinMesh/leafTemplate";
import { TextureGeneratorParameters } from "../veinMesh/textureGenerator";
import { WhorlParameters } from "../whorl";
import { BranchingPattern, DNA } from "./dna";

export function generateRandomDNA(envMap: THREE.CubeTexture): DNA {
    const leafTemplate = randomLeafTemplate(envMap);
    const petalTemplate = randomPetalTemplate(envMap);

    const leafWhorlTemplate = randomWhorlParametersLeaf(leafTemplate);
    const petalWhorlTemplate = randomWhorlParametersPetal(petalTemplate);

    const branchingPattern = randomBranchingPattern(leafTemplate);

    return {
        branchingPattern,
        leafTemplate,
        leafWhorlTemplate,
        petalTemplate,
        petalWhorlTemplate,
    };
}

export function randomLeafTemplate(envMap: THREE.CubeTexture) {
    const veinedLeaf = generateRandomVeinedLeaf(generateVeinGrowthParameters);
    const leafTextureParameters: TextureGeneratorParameters = {
        innerColor: new THREE.Color("green"),
        outerColor: new THREE.Color("green"),
        veinColor: new THREE.Color("darkgreen"),
        veinAlpha: 1,
        bumpNoiseHeight: 1,
        baseMaterialParams: {
            roughness: 0.4,
            metalness: 0,
        },
    };
    return LeafTemplate.fromVeinedLeaf(veinedLeaf, leafTextureParameters, envMap);
}

export function randomPetalTemplate(envMap: THREE.CubeTexture) {
    const veinedPetal = generateRandomVeinedLeaf(generatePetalGrowthParameters);
    const petalTextureParameters: TextureGeneratorParameters = {
        innerColor: new THREE.Color(`hsl(${THREE.Math.randInt(180, 360 + 60)}, 100%, ${THREE.Math.randInt(50, 100)}%)`),
        outerColor: new THREE.Color(`hsl(${THREE.Math.randInt(180, 360 + 60)}, 100%, ${THREE.Math.randInt(50, 100)}%)`),
        veinColor: new THREE.Color(),
        veinAlpha: 0,
        bumpNoiseHeight: 0.1,
        baseMaterialParams: {
            roughness: 1,
            metalness: 0,
            // shininess: 0,
        },
    };
    return LeafTemplate.fromVeinedLeaf(veinedPetal, petalTextureParameters, envMap);
}

export function randomWhorlParametersLeaf(leafTemplate: LeafTemplate): WhorlParameters<Leaf> {
    const zRot = THREE.Math.randFloat(Math.PI / 20, Math.PI / 3);
    const endYRot = Math.random() < 0.5 ? Math.PI * 2 : Math.PI;
    const scale = THREE.Math.randFloat(0.5, 1);
    const isBilateral = Math.random() < 0.5;
    return {
        num: THREE.Math.randInt(1, 3),
        startZRot: zRot,
        endZRot: zRot,
        startYRot: 0,
        endYRot,
        endScale: scale,
        startScale: scale,
        generate: () => Leaf.generate(leafTemplate),
        isBilateral,
    };
}

export function randomWhorlParametersPetal(petalTemplate: LeafTemplate): WhorlParameters<Petal> {
    // const num = THREE.Math.randInt(5, 12 + (Math.random() < 0.1 ? THREE.Math.randInt(20, 40) : 0));
    const num = THREE.Math.randInt(5, 12);
    const maxRotations = Math.floor(num / 8);
    const zRot = Math.PI / 2 * 0.9;
    return {
        num,
        startYRot: 0,
        endYRot: Math.PI * 2,
        startScale: 1,
        endScale: 1,
        startZRot: zRot,
        endZRot: zRot,
        // endZRot: THREE.Math.randFloat(Math.PI / 12, Math.PI / 4),
        isBilateral: false,
        generate: () => Petal.generate(petalTemplate),
    };
    // if (Math.random() < 1 / 3) {
    //     // make 5 big ones
    //     return {
    //         num: 5,
    //         startYRot: 0,
    //         endYRot: Math.PI * 2,
    //         startScale: 0.9,
    //         endScale: 0.9,
    //         startZRot: Math.PI / 12,
    //         endZRot: Math.PI / 12,
    //         isBilateral: false,
    //         generate: Petal.generate,
    //     };
    // } else if(Math.random() < 0.5) {
    //     // 6 evenly spread
    //     return {
    //         num: 6,
    //         startYRot: 0,
    //         endYRot: Math.PI * 2,
    //         startScale: 1,
    //         endScale: 1,
    //         startZRot: Math.PI / 4,
    //         endZRot: Math.PI / 4,
    //         isBilateral: false,
    //         generate: Petal.generate,
    //     };
    // } else {
    //     return {
    //         num: 63,
    //         startYRot: 0,
    //         endYRot: Math.PI * 8,
    //         startScale: 0.8,
    //         endScale: 0.5,
    //         startZRot: 0,
    //         endZRot: Math.PI / 4,
    //         isBilateral: false,
    //         generate: Petal.generate,
    //     };
    // }
}

export function randomBranchingPattern(leafTemplate: LeafTemplate): BranchingPattern {
    return {
        getComponentsFor: (bone) => {
            // we're at the end, grow a flower
            if (bone.children.length === 0) {
                const flower = Flower.generate();
                flower.position.y = bone.position.y;
                return [flower];
                // return Flower.generate();
            }

            const BONES_PER_GROWTH = 10;
            const growthsPerRotation = 4;

            if (bone.index % BONES_PER_GROWTH === BONES_PER_GROWTH - 1) {
                // create a leaf
                function genLeaf(yAngle: number) {
                    const leaf = Leaf.generate(leafTemplate);
                    leaf.rotateY(yAngle);
                    leaf.rotateZ(Math.PI / 4);
                    return leaf;
                }
                const xAngle = bone.index / BONES_PER_GROWTH * Math.PI * 2 / growthsPerRotation;
                const leaves = [genLeaf(xAngle), genLeaf(xAngle + Math.PI)];
                // const leaves = [Leaves.generate()];

                const totalBones = bone.branch.meshManager.skeleton.bones.length;
                const percentDist = bone.index / totalBones;
                // console.log(percentDist);
                if (Math.random() > percentDist) {
                    const newBranchLength = (1 - percentDist) * 0.8 * bone.branch.finalBranchLength;
                    if (newBranchLength >= 1) {
                        const branch = new Branch(newBranchLength);
                        branch.rotateY(Math.PI * 2 * Math.random());
                        // const randYDir = Math.random() * Math.PI * 2;
                        // TODO should we rotate bones[0]? or should we rotate the Branch itself?
                        // branch.meshManager.skeleton.bones[0].rotateZ(-Math.PI / 2);
                        branch.rotateZ(-Math.PI / 4);
                        return [branch, ...leaves];
                    }
                    return leaves;
                } else {
                    return leaves;
                }
            }
            return null;
        },
    };
}
