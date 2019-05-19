const PARAMS_DEFAULT = {
    isRealtime: true,
    cellEnergyMax: 4000,
    tissueInventoryCapacity: 6,
    rootTurnsPerTransfer: 10,
    leafReactionRate: 0.05,
    floorCo2: 0.5,
    leafSugarPerReaction: 1,
    waterDiffusionRate: 0.001,
    cellDiffusionWater: 0.02,
    waterDiffusionType: "continuous",
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
