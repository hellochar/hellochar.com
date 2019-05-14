import { parse } from "query-string";

interface SearchParams {
    isRealtime: string;
    cellEnergyMax: string;
    tissueInventoryCapacity: string;
    rootTurnsPerTransfer: string;
    leafReactionRate: string;
    leafSugarPerReaction: string;
    waterDiffusionRate: string;
    waterGravityPerTurn: string;
    droop: string;
    fountainTurnsPerWater: string;
    transportTurnsPerMove: string;
    sunlightReintroduction: string;
    maxResources: string;
}
const params: SearchParams = parse(location.search);

export const IS_REALTIME = Boolean(params.isRealtime) || true;

export const CELL_ENERGY_MAX = Number(params.cellEnergyMax) || 4000;
export const ENERGY_TO_SUGAR_RATIO = Number(params.cellEnergyMax) || 4000;
export const CELL_SUGAR_BUILD_COST = CELL_ENERGY_MAX / ENERGY_TO_SUGAR_RATIO;

export const ROOT_TURNS_PER_TRANSFER = Number(params.rootTurnsPerTransfer) || 10;

export const SOIL_MAX_WATER = 20;
export const TISSUE_INVENTORY_CAPACITY = Number(params.tissueInventoryCapacity) || 6;
export const LEAF_MAX_CHANCE = Number(params.leafReactionRate) || 0.05;
export const LEAF_SUGAR_PER_REACTION = Number(params.leafSugarPerReaction) || 1;
export const WATER_DIFFUSION_RATE = Number(params.waterDiffusionRate) || 0.03;

export const WATER_GRAVITY_PER_TURN = Number(params.waterGravityPerTurn) || 0.05;

export const DROOP_PER_TURN = Number(params.droop) || 0.03;

export const FOUNTAINS_TURNS_PER_WATER = Number(params.fountainTurnsPerWater) || 10;

export const TRANSPORT_TURNS_PER_MOVE = Number(params.transportTurnsPerMove) || 5;

export const SUNLIGHT_REINTRODUCTION = Number(params.sunlightReintroduction) || 0.2;
export const PLAYER_MAX_INVENTORY = Number(params.maxResources) || 100;
