import { DNA } from "./dna";
import { generateRandomDNA } from "./generateRandomDna";

let dnaBacking!: DNA;
export const dna: DNA = {
    get leafTemplate() { return dnaBacking.leafTemplate; },
    get petalTemplate() { return dnaBacking.petalTemplate; },
    get leafWhorlTemplate() { return dnaBacking.leafWhorlTemplate; },
    get petalWhorlTemplate() { return dnaBacking.petalWhorlTemplate; },

    get branchingPattern() { return dnaBacking.branchingPattern; }
};

export * from "./dna";
export * from "./generateRandomDna";

export function randomizeDna(envMap: THREE.CubeTexture) {
    dnaBacking = generateRandomDNA(envMap);
}

export default dna;
