import { LeafTemplate } from "./leaf/leafTemplate";
import { generateRandomGrowthParameters, LeafGrowthParameters } from "./leaf/leafSkeleton";

let parameters: LeafGrowthParameters = generateRandomGrowthParameters();
let leafTemplate: LeafTemplate = LeafTemplate.fromGrowthParameters(parameters);

export const dna = {
    get parameters() { return parameters; },
    get leafTemplate() { return leafTemplate; },
}

export default dna;
