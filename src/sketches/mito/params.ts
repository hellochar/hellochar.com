const PARAMS_DEFAULT = {
    isRealtime: true,
    cellEnergyMax: 5000,
    tissueInventoryCapacity: 20,
    rootTurnsPerTransfer: 20,
    leafReactionRate: 0.015,
    leafSugarPerReaction: 1,
    cellGestationTurns: 0,
    cellDiffusionWater: 0.002,
    cellDiffusionSugar: 0.002,
    soilDarknessBase: 0.2,
    soilDiffusionType: "discrete",
    soilDiffusionWater: 0.001,
    veinDiffusion: 0.8,
    soilMaxWater: 20,
    droop: 0.03,
    fountainTurnsPerWater: 11,
    fountainAppearanceRate: 1.5,
    transportTurnsPerMove: 5,
    sunlightReintroduction: 0.15,
    sunlightDiffusion: 0.0,
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
    } else {
        location.hash = "";
    }
}
updateParamsHash();
