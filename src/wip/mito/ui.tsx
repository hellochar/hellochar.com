import * as React from "react";

import { Constructor } from "./index";
import { Cell } from "./tile";

interface UIState {
    autoplace: Constructor<Cell> | undefined;
    water: number;
    sugar: number;
}

export default class UI extends React.Component<{}, UIState> {
    state: UIState = {
        water: 0,
        sugar: 0,
        autoplace: undefined,
    };

    public render() {
        const autoplace = this.state.autoplace === undefined ? "none" : this.state.autoplace.name;
        return (
            <div className="ui">
                <span>autoplace: {autoplace}</span> - <span>water:{this.state.water},</span> <span>sugar:{this.state.sugar}</span>
            </div>
        );
    }
}
