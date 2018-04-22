import * as THREE from "three";

import { Petal } from "./flower";
import { generateRandomGrowthParameters, Leaf, LeafGrowthParameters, LeafTemplate } from "./leaf";
import { WhorlParameters } from "./whorl";
import { VeinedLeaf, generateRandomVeinedLeaf } from "./vein/veinedLeaf";
import { generateVeinGrowthParameters } from "./vein/vein";

export function generateRandomLeafWhorlParameters(): WhorlParameters<Leaf> {
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
        generate: () => Leaf.generate(dna.leafTemplate),
        isBilateral,
    };
}

export function generateRandomPetalWhorlParameters(): WhorlParameters<Petal> {
    const num = THREE.Math.randInt(5, 12 + (Math.random() < 0.1 ? THREE.Math.randInt(20, 40) : 0));
    const maxRotations = Math.floor(num / 8);
    return {
        num,
        startYRot: 0,
        endYRot: Math.PI * 2 * THREE.Math.randInt(1, maxRotations),
        startScale: 1,
        endScale: 1,
        startZRot: Math.PI / 20,
        endZRot: THREE.Math.randFloat(Math.PI / 12, Math.PI / 4),
        isBilateral: Math.random() < 0.5,
        generate: Petal.generate,
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

let parameters: LeafGrowthParameters;
let leafTemplate: LeafTemplate;
let leafWhorlTemplate: WhorlParameters<Leaf>;
let petalWhorlTemplate: WhorlParameters<Petal>;
let colors: {
    petalInnerColor: THREE.Color;
    petalOuterColor: THREE.Color;
};
let veinedLeaf: VeinedLeaf;

export function randomizeDna() {
    parameters = generateRandomGrowthParameters();
    leafTemplate = LeafTemplate.fromGrowthParameters(parameters);
    leafWhorlTemplate = generateRandomLeafWhorlParameters();
    petalWhorlTemplate = generateRandomPetalWhorlParameters();
    colors = {
        // no green leaves (greens are hues between 60 -> 180)
        petalInnerColor: new THREE.Color(`hsl(${THREE.Math.randInt(180, 360 + 60)}, 100%, ${THREE.Math.randInt(50, 100)}%)`),
        petalOuterColor: new THREE.Color(`hsl(${THREE.Math.randInt(180, 360 + 60)}, 100%, ${THREE.Math.randInt(50, 100)}%)`),
    }
    veinedLeaf = generateRandomVeinedLeaf();
}

export const dna = {
    get parameters() { return parameters; },
    get leafTemplate() { return leafTemplate; },
    get leafWhorlTemplate() { return leafWhorlTemplate; },
    get petalWhorlTemplate() { return petalWhorlTemplate; },
    get colors() { return colors; },
    get veinedLeaf() { return veinedLeaf; },
}

export default dna;
