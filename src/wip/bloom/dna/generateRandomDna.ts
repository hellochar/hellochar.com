import * as THREE from "three";

import { Branch } from "../branch";
import { FeedParticles } from "../feedParticles";
import { Flower, Petal, Stamen, Tepal } from "../flower";
import { Leaf } from "../leaf";
import Leaves from "../leaf/leaves";
import { generatePetalGrowthParameters, generateRandomVeinedLeaf, generateTepalGrowthParameters, generateVeinGrowthParameters } from "../vein/veinedLeaf";
import { LeafTemplate } from "../veinMesh/leafTemplate";
import { TextureGeneratorParameters } from "../veinMesh/textureGenerator";
import { WhorlParameters } from "../whorl";
import { BranchingPattern, BranchTemplate, DNA, GrowthParameters } from "./dna";

export function generateRandomDNA(envMap: THREE.CubeTexture): DNA {

    // const hue = THREE.Math.randInt(130, 160);
    // const hue = THREE.Math.randInt(105, 135);
    // const saturationPercent = Math.sqrt(THREE.Math.randFloat(0.5, 1)) * 100;
    // const luminancePercent = THREE.Math.randInt(50, 100);
    // const color = new THREE.Color(`hsl(${hue}, ${saturationPercent.toFixed(0)}%, ${luminancePercent}%)`);
    const color = new THREE.Color("green");

    FeedParticles.material.color = color;
    FeedParticles.material.needsUpdate = true;

    const branchTemplate = randomBranchTemplate(color, envMap);
    const leafTemplate = randomLeafTemplate(color, envMap);
    const petalTemplate = randomPetalTemplate(envMap);
    const tepalTemplate = randomTepalTemplate(color, envMap);

    const leafWhorlTemplate = randomWhorlParametersLeaf(leafTemplate);
    const petalWhorlTemplate = randomWhorlParametersPetal(petalTemplate);
    const tepalWhorl = randomWhorlParametersTepal(tepalTemplate);
    const stamenWhorl = randomWhorlStamen();

    const branchingPattern = randomBranchingPattern(leafTemplate);

    const growth = randomGrowthParameters();

    return {
        branchingPattern,
        branchTemplate,
        growth,
        leafTemplate,
        leafWhorlTemplate,
        petalTemplate,
        petalWhorlTemplate,
        stamenWhorl,
        tepalTemplate,
        tepalWhorl,
    };
}

export function randomBranchTemplate(greenColor: THREE.Color, envMap: THREE.CubeTexture): BranchTemplate {
    // console.log(hue, saturationPercent, luminancePercent, color);

    // const color = "green";
    // TODO maybe use envmap for this? probably don't need to though honestly
    const material = new THREE.MeshLambertMaterial({ skinning: true, color: greenColor, side: THREE.DoubleSide });

    const fullMaturityThickness = THREE.Math.mapLinear(
        Math.random() + Math.random() + Math.random() + Math.random(),
        0,
        4,
        0.01,
        0.05,
    );
    return {
        fullMaturityThickness,
        material,
    };
}

export function randomLeafTemplate(color: THREE.Color, envMap: THREE.CubeTexture) {
    const veinedLeaf = generateRandomVeinedLeaf(generateVeinGrowthParameters);
    const leafTextureParameters: TextureGeneratorParameters = {
        innerColor: color,
        outerColor: color,
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

export function randomTepalTemplate(color: THREE.Color, envMap: THREE.CubeTexture) {
    const veinedTepal = generateRandomVeinedLeaf(generateTepalGrowthParameters);
    const tepalTextureParameters: TextureGeneratorParameters = {
        innerColor: color,
        outerColor: color,
        veinColor: new THREE.Color("darkgreen"),
        veinAlpha: 0.0,
        bumpNoiseHeight: 0,
        baseMaterialParams: {
            bumpScale: 0.01,
            roughness: 0.8,
            metalness: 0,
        },
    };
    return LeafTemplate.fromVeinedLeaf(veinedTepal, tepalTextureParameters, envMap);
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

export function randomWhorlParametersTepal(tepalTemplate: LeafTemplate): WhorlParameters<Tepal> {
    // const num = THREE.Math.randInt(5, 12 + (Math.random() < 0.1 ? THREE.Math.randInt(20, 40) : 0));
    const num = THREE.Math.randInt(5, 12);
    const maxRotations = Math.floor(num / 8);
    const zRot = Math.PI / 3;
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
        generate: () => Petal.generate(tepalTemplate),
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

export function randomWhorlStamen() {
    const num = THREE.Math.randInt(3, 6) + (Math.random() < 0.1 ? THREE.Math.randInt(10, 20) : 0);
    const endZRot = -Math.PI / 8;
    // the problem with the whorls is that there's no symmetry - it's very easy to make asymmetric things.
    return {
        num,
        endScale: 0.4,
        startScale: 0.5,
        startYRot: 0,
        endYRot: Math.PI * 2,
        startZRot: 0,
        endZRot: endZRot,
        isBilateral: true,
        generate: Stamen.generate,
    };
}

export function randomBranchingPattern(leafTemplate: LeafTemplate): BranchingPattern {
    const branchLengthScalar = THREE.Math.randFloat(0.7, 0.9);
    const branchRotationZ = THREE.Math.randFloat(Math.PI / 3, Math.PI / 12);
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
                // // create a leaf
                // function genLeaf(yAngle: number) {
                //     const leaf = Leaf.generate(leafTemplate);
                //     leaf.rotateY(yAngle);
                //     leaf.rotateZ(Math.PI / 4);
                //     leaf.scale.multiplyScalar(0.6);
                //     return leaf;
                // }
                // const xAngle = bone.index / BONES_PER_GROWTH * Math.PI * 2 / growthsPerRotation;
                // const leaves = [genLeaf(xAngle), genLeaf(xAngle + Math.PI)];
                const leaves = [Leaves.generate()];

                const totalBones = bone.branch.meshManager.skeleton.bones.length;
                const percentDist = bone.index / totalBones;
                // console.log(percentDist);
                if (Math.random() > percentDist) {
                    const newBranchLength = (1 - percentDist) * branchLengthScalar * bone.branch.finalBranchLength;
                    if (newBranchLength >= 1) {
                        const branch = new Branch(newBranchLength);
                        branch.rotateY(Math.PI * 2 * Math.random());
                        // const randYDir = Math.random() * Math.PI * 2;
                        // TODO should we rotate bones[0]? or should we rotate the Branch itself?
                        // branch.meshManager.skeleton.bones[0].rotateZ(-Math.PI / 2);
                        branch.rotateZ(-branchRotationZ);
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

export function randomGrowthParameters(): GrowthParameters {
    const boneCurveUpwardsFactor = 0.0001;
    // const boneCurveUpwardsFactor = 0.001;
    const budDevelopmentThreshold = 0.1;
    const childScalar = 0.8;
    const feedSelfMax = 0.2;

    return {
        boneCurveUpwardsFactor,
        budDevelopmentThreshold,
        childScalar,
        feedSelfMax,
    };
}
