const PARAMS_DEFAULT = {
    isRealtime: true,
    cellEnergyMax: 4000,
    tissueInventoryCapacity: 6,
    rootTurnsPerTransfer: 10,
    leafReactionRate: 0.05,
    leafSugarPerReaction: 1,
    waterDiffusionRate: 0.02,
    waterDiffusionType: "discrete",
    sugarDiffusionRate: 0,
    waterGravityPerTurn: 0.05,
    soilMaxWater: 20,
    droop: 0.03,
    fountainTurnsPerWater: 10,
    transportTurnsPerMove: 5,
    sunlightReintroduction: 0.2,
    maxResources: 100,
};

type Params = typeof PARAMS_DEFAULT;

export const params = { ...PARAMS_DEFAULT };

if (location.hash.length > 0) {
    const urlHashParams: object = JSON.parse(decodeURI(location.hash.substr(1)));
    Object.assign(params, urlHashParams);
}

export function updateParamsHash() {
    const nonDefaultParams: Partial<Params> = {};
    const keys = Object.keys(PARAMS_DEFAULT) as Array<keyof Params>;
    for (const key of keys) {
        if (params[key] !== PARAMS_DEFAULT[key]) {
            nonDefaultParams[key] = params[key];
        }
    }
    if (Object.keys(nonDefaultParams).length > 0) {
        location.hash = encodeURI(JSON.stringify(nonDefaultParams));
    }
}
updateParamsHash();

// export let IS_REALTIME = PARAMS.isRealtime;
// export let CELL_ENERGY_MAX = PARAMS.cellEnergyMax;
// export let ENERGY_TO_SUGAR_RATIO = PARAMS.cellEnergyMax;
// export let CELL_SUGAR_BUILD_COST = CELL_ENERGY_MAX / ENERGY_TO_SUGAR_RATIO;
// export let ROOT_TURNS_PER_TRANSFER = PARAMS.rootTurnsPerTransfer;
// export let SOIL_MAX_WATER = PARAMS.soilMaxWater;
// export let TISSUE_INVENTORY_CAPACITY = PARAMS.tissueInventoryCapacity;
// export let LEAF_MAX_CHANCE = PARAMS.leafReactionRate;
// export let LEAF_SUGAR_PER_REACTION = PARAMS.leafSugarPerReaction;
// export let WATER_DIFFUSION_RATE = PARAMS.waterDiffusionRate;
// export let WATER_DIFFUSION_TYPE = PARAMS.waterDiffusionType;
// export let SUGAR_DIFFUSION_RATE = PARAMS.sugarDiffusionRate;
// export let WATER_GRAVITY_PER_TURN = PARAMS.waterGravityPerTurn;
// export let DROOP_PER_TURN = PARAMS.droop;
// export let FOUNTAINS_TURNS_PER_WATER = PARAMS.fountainTurnsPerWater;
// export let TRANSPORT_TURNS_PER_MOVE = PARAMS.transportTurnsPerMove;
// export let SUNLIGHT_REINTRODUCTION = PARAMS.sunlightReintroduction;
// export let PLAYER_MAX_INVENTORY = PARAMS.maxResources;
