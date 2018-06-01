import * as THREE from "three";

import { BranchingPattern, DefaultBranchingPattern } from "../branch/branchingPattern";
import { FeedParticles } from "../feedParticles";
import { Petal, Stamen, Tepal } from "../flower";
import { Leaf } from "../leaf";
import { generatePetalGrowthParameters, generateRandomVeinedLeaf, generateTepalGrowthParameters, generateVeinGrowthParameters, VeinedLeaf } from "../vein/veinedLeaf";
import { LeafTemplate } from "../veinMesh/leafTemplate";
import { TextureGeneratorParameters } from "../veinMesh/textureGenerator";
import { WhorlParameters } from "../whorl";
import { BranchTemplate, DNA, GrowthParameters } from "./dna";

export function generateRandomDNA(envMap: THREE.CubeTexture): DNA {

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

    const tepalColor = new THREE.Color(`hsl(${THREE.Math.randInt(110, 130)}, 90%, 50%)`);
    const tepalTemplate = randomTepalTemplate(tepalColor, envMap);

    const leafWhorlTemplate = randomWhorlParametersLeaf(leafTemplate);
    const petalWhorlTemplate = randomWhorlParametersPetal(petalTemplate);
    const tepalWhorl = randomWhorlParametersTepal(tepalTemplate);
    const stamenWhorl = randomWhorlStamen();

    const branchingPattern = randomBranchingPattern();

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
    const roughness = THREE.Math.randFloat(0.2, 1);
    const metalness = THREE.Math.randFloat(0, 0.25);
    const leafTextureParameters: TextureGeneratorParameters = {
        innerColor: color,
        outerColor: color,
        veinColor: new THREE.Color("darkgreen"),
        veinAlpha: 1,
        bumpVeinAlpha: 1,
        bumpNoiseHeight: 1,
        baseMaterialParams: {
            roughness,
            metalness,
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
        bumpVeinAlpha: 0.5,
        bumpNoiseHeight: 0.5,
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
        veinAlpha: 0.01,
        bumpNoiseHeight: 2,
        bumpVeinAlpha: 0.5,
        baseMaterialParams: {
            bumpScale: 0.05,
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

function getRandomWhorlNum(leaf: LeafTemplate) {
    const boundingBox = leaf.veinedLeaf.getBoundingBox();
    const yExtent = boundingBox.getSize().y * leaf.veinedLeaf.normalizationDownScalar! * THREE.Math.randFloat(0.7, 1.5);
    // at extent 1, we have a "fat" leaf and we can only fit like 4 of them probably
    const totalAnglage = Math.PI * 2;
    const angleOfOnePetal = THREE.Math.mapLinear(yExtent, 0, 1, 0, Math.PI / 2);
    const num = THREE.Math.clamp(
        Math.floor(totalAnglage / angleOfOnePetal + Math.random()),
        3,
        20,
    );
    return num;
}

export function randomWhorlParametersPetal(petalTemplate: LeafTemplate): WhorlParameters<Petal> {
    // const num = THREE.Math.randInt(5, 12 + (Math.random() < 0.1 ? THREE.Math.randInt(20, 40) : 0));
    // const num = THREE.Math.randInt(5, 12);

    const num = getRandomWhorlNum(petalTemplate);

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
}

export function randomWhorlParametersTepal(tepalTemplate: LeafTemplate): WhorlParameters<Tepal> {
    const num = getRandomWhorlNum(tepalTemplate);
    // const num = THREE.Math.randInt(5, 12 + (Math.random() < 0.1 ? THREE.Math.randInt(20, 40) : 0));
    // const num = THREE.Math.randInt(5, 12);

    const maxRotations = Math.floor(num / 8);
    const zRot = Math.PI / 2;
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
        generate: () => Tepal.generate(tepalTemplate),
    };
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

export function randomBranchingPattern(): BranchingPattern {
    return new DefaultBranchingPattern();
}

export function randomGrowthParameters(): GrowthParameters {
    const boneCurveUpwardsFactor = 0.0001 * Math.pow(2, THREE.Math.randFloat(-1, 1));
    // const boneCurveUpwardsFactor = 0.001;
    const budDevelopmentThreshold = 0.5;
    const childScalar = 0.8;
    const feedSelfMax = THREE.Math.randFloat(0.1, 0.3);

    return {
        boneCurveUpwardsFactor,
        budDevelopmentThreshold,
        childScalar,
        feedSelfMax,
    };
}
