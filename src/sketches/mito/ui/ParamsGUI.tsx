import * as dat from 'dat.gui';
import * as React from 'react';

import { ALL_ENVIRONMENTS } from '../game/environment';
import { params, updateParamsHash } from "../params";

export class ParamsGUI extends React.Component {
    private gui: dat.GUI;
    constructor(props: any) {
        super(props);
        const gui = new dat.GUI({
            closed: true,
            width: 450,
        });
        gui.add(params, "environment", Object.keys(ALL_ENVIRONMENTS)).onChange(() => setTimeout(() => location.reload(), 100));
        gui.add(params, "droop", 0, 0.5, 0.01);
        gui.add(params, "fountainTurnsPerWater", 1, 100, 1);
        gui.add(params, "isRealtime");
        gui.add(params, "leafReactionRate", 0, 0.2, .0001);
        gui.add(params, "leafSugarPerReaction", 0, 1, .01);
        gui.add(params, "rootTurnsPerTransfer", 1, 100, 1);
        gui.add(params, "soilDarknessBase", 0, 1, 0.01);
        gui.add(params, "soilDiffusionType", ["discrete", "continuous"]);
        gui.add(params, "sunlightReintroduction", 0, 1, 0.01);
        gui.add(params, "sunlightDiffusion", 0, 1, 0.01);
        gui.add(params, "transportTurnsPerMove", 1, 50, 1);
        gui.add(params, "veinDiffusion", 0, 0.85, 0.0001);
        const f = gui.addFolder("Needs Page Refresh");
        f.add(params, "cellGestationTurns", 0, 100, 1);
        f.add(params, "cellDiffusionSugar", 0, .85, 0.0001);
        f.add(params, "cellDiffusionWater", 0, .85, 0.0001);
        f.add(params, "cellEnergyMax", 400, 10000, 100);
        f.add(params, "fountainAppearanceRate", 1, 5, 0.1);
        f.add(params, "maxResources", 10, 1000, 1);
        f.add(params, "soilDiffusionWater", 0, .25, 0.00001);
        f.add(params, "soilMaxWater", 1, 100, 1);
        f.add(params, "tissueInventoryCapacity", 1, 100, 1);

        for (const c of gui.__controllers.concat(f.__controllers)) {
            c.onFinishChange(updateParamsHash);
        }

        this.gui = gui;
    }

    render() {
        return null;
    }
}
