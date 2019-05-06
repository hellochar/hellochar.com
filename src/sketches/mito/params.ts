import { parse } from "query-string";

interface SearchParams {
    cellEnergyMax: string;
    tissueInventoryCapacity: string;
    leafReactionRate: string;
    waterDiffusionRate: string;
    droop: string;
    fountainTurnsPerWater: string;
    transportTurnsPerMove: string;
    sunlightReintroduction: string;
    maxResources: string;
}
const params: SearchParams = parse(location.search);

export const CELL_ENERGY_MAX = Number(params.cellEnergyMax) || 2000;
export const ENERGY_TO_SUGAR_RATIO = Number(params.cellEnergyMax) || 2000;
export const CELL_SUGAR_BUILD_COST = CELL_ENERGY_MAX / ENERGY_TO_SUGAR_RATIO;

export const SOIL_MAX_WATER = 20;
export const TISSUE_INVENTORY_CAPACITY = Number(params.tissueInventoryCapacity) || 6;
export const LEAF_MAX_CHANCE = Number(params.leafReactionRate) || 0.02;
export const WATER_DIFFUSION_RATE = Number(params.waterDiffusionRate) || 0.01;

export const DROOP_PER_TURN = Number(params.droop) || 0.03;

export const FOUNTAINS_TURNS_PER_WATER = Number(params.fountainTurnsPerWater) || 10;

export const TRANSPORT_TURNS_PER_MOVE = Number(params.transportTurnsPerMove) || 1;

export const SUNLIGHT_REINTRODUCTION = Number(params.sunlightReintroduction) || 0.2;
export const PLAYER_MAX_INVENTORY = Number(params.maxResources) || 100;
