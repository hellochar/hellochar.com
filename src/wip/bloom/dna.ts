import * as THREE from "three";

import { Petal } from "./flower";
import { Leaf } from "./leaf";
import { generateRandomVeinedLeaf, VeinedLeaf, generateVeinGrowthParameters, generatePetalGrowthParameters } from "./vein/veinedLeaf";
import { LeafTemplate } from "./veinMesh/leafTemplate";
import { TextureGeneratorParameters } from "./veinMesh/textureGenerator";
import { WhorlParameters } from "./whorl";

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
    // const num = THREE.Math.randInt(5, 12 + (Math.random() < 0.1 ? THREE.Math.randInt(20, 40) : 0));
    const num = THREE.Math.randInt(5, 12);
    const maxRotations = Math.floor(num / 8);
    return {
        num,
        startYRot: 0,
        endYRot: Math.PI * 2,
        startScale: 1,
        endScale: 1,
        startZRot: 0,
        endZRot: 0,
        // endZRot: THREE.Math.randFloat(Math.PI / 12, Math.PI / 4),
        isBilateral: false,
        generate: () => Petal.generate(dna.petalTemplate),
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

let leafTemplate: LeafTemplate;
let petalTemplate: LeafTemplate;
let leafWhorlTemplate: WhorlParameters<Leaf>;
let petalWhorlTemplate: WhorlParameters<Petal>;

export function randomizeDna(envMap: THREE.CubeTexture) {
    leafWhorlTemplate = generateRandomLeafWhorlParameters();
    petalWhorlTemplate = generateRandomPetalWhorlParameters();

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
        }
    };
    leafTemplate = LeafTemplate.fromVeinedLeaf(veinedLeaf, leafTextureParameters, envMap);

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
    petalTemplate = LeafTemplate.fromVeinedLeaf(veinedPetal, petalTextureParameters, envMap);
}

export const dna = {
    get leafTemplate() { return leafTemplate; },
    get petalTemplate() { return petalTemplate; },
    get leafWhorlTemplate() { return leafWhorlTemplate; },
    get petalWhorlTemplate() { return petalWhorlTemplate; },
}

export default dna;
