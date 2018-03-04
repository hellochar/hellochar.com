import * as React from "react";

import { Constructor } from "./index";
import { Cell, Tile, hasEnergy } from "./tile";
import { hasInventory } from "./inventory";

interface HUDState {
    autoplace: Constructor<Cell> | undefined;
    water: number;
    sugar: number;
}

export class HUD extends React.Component<{}, HUDState> {
    state: HUDState = {
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

interface HoverState {
    show?: boolean;
    left?: number;
    top?: number;
    tile?: Tile;
}

export class TileHover extends React.Component<{}, HoverState> {
    state: HoverState = {
        tile: undefined,
    };

    public render() {
        const {tile, left, top} = this.state;
        if (tile == null || !this.state.show) {
            return null;
        }
        const style: React.CSSProperties = {
            left: left,
            top: top,
            width: "100px",
            position: "fixed",
            background: "rgba(255, 255, 255, 0.8)",
            pointerEvents: "none",
            borderRadius: 2,
            border: "1px solid rgb(220, 220, 220)",
        };
        const energySpan = hasEnergy(tile) ? <span>{tile.energy.toFixed(0)}%</span> : null;
        const inventorySpan = hasInventory(tile) ? <span>{tile.inventory.water} / {tile.inventory.sugar.toFixed(0)} of {tile.inventory.capacity}</span> : null;
        return (
            <div className="hover" style={style}>
                {tile.constructor.name}
                <br />
                {energySpan}
                <br />
                {inventorySpan}
            </div>
        );
    }
}
