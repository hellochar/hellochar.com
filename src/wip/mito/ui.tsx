import * as React from "react";

import { Constructor, GameState } from "./index";
import { hasInventory } from "./inventory";
import { Air, Cell, CELL_ENERGY_MAX, hasEnergy, Leaf, LEAF_MAX_CHANCE, Tile } from "./tile";

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
        const styles: React.CSSProperties = {
            background: "rgba(255, 255, 255, 0.8)",
            padding: "10px",
        };
        return (
            <div className="ui" style={styles}>
                <span>autoplace: {autoplace}</span> - <span>water:{this.state.water},</span> <span>sugar:{this.state.sugar}</span>
            </div>
        );
    }
}

export interface GameStackState {
    state: GameState;
}

export class GameStack extends React.Component<{}, GameStackState> {
    state: GameStackState = {
        state: "main",
    };

    public render() {
        const style: React.CSSProperties = {
            width: "100%",
            height: "100%",
            position: "absolute",
            background: "rgba(255, 255, 255, 0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "40px",
        };
        if (this.state.state === "main") {
            return null;
        } else if (this.state.state === "win") {
            return (
                <div className="screen-win" style={style}>
                You won!
                </div>
            );
        } else {
            return (
                <div className="screen-lose" style={style}>
                You lost!
                </div>
            );
        }
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
        const {tile, left, top, show} = this.state;
        if (!show) {
            return null;
        }
        const style: React.CSSProperties = {
            left: left,
            top: top,
            width: "120px",
            minHeight: "25px",
            position: "fixed",
            background: "rgba(255, 255, 255, 0.8)",
            pointerEvents: "none",
            borderRadius: 2,
            border: "1px solid rgb(220, 220, 220)",
        };
        if (tile == null) {
            return <div className="hover" style={style}>Unknown</div>;
        }

        const energyInfo = hasEnergy(tile) ? <span>{(tile.energy / CELL_ENERGY_MAX * 100).toFixed(0)}%</span> : null;
        const inventoryInfo = hasInventory(tile) ? <span>{tile.inventory.water} / {tile.inventory.sugar.toFixed(0)} of {tile.inventory.capacity}</span> : null;
        const cellInfo = tile instanceof Cell ? <span>{tile.metabolism.type}, {(tile.droopY * 200).toFixed(0)}% droop</span> : null;
        const leafInfo = tile instanceof Leaf ? (
            <div>
                <div>{(1 / (tile.averageSpeed * LEAF_MAX_CHANCE)).toFixed(0)} turns per reaction</div>
                <div>{(1 / tile.averageEfficiency).toFixed(2)} water per sugar</div>
            </div>
        ) : null;
        const airSpan = tile instanceof Air ? <span>sunlight: {(tile.sunlight() * 100).toFixed(0)}%, co2: {(tile.co2() * 100).toFixed(0)}%</span> : null;
        const spans = [energyInfo, inventoryInfo, cellInfo, leafInfo, airSpan];
        const children = ([] as JSX.Element[]).concat(
            ...spans.map((span) => {
                return span == null ? [] : [<br />, span];
            }),
        );
        return (
            <div className="hover" style={style}>
                {tile.constructor.name} ({tile.pos.x}, {tile.pos.y}) ({tile.darkness})
                { children }
            </div>
        );
    }
}
