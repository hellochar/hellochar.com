import * as React from "react";

import { Constructor, GameState } from "./index";
import { hasInventory } from "./inventory";
import { Air, Cell, CELL_ENERGY_MAX, hasEnergy, Leaf, LEAF_MAX_CHANCE, Tile, TileConstructor } from "./tile";

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

        const spans = [this.energyInfo(tile), this.inventoryInfo(tile), this.cellInfo(tile), this.leafInfo(tile), this.airInfo(tile)];
        const children = ([] as JSX.Element[]).concat(
            ...spans.map((span) => {
                return span == null ? [] : [<br />, span];
            }),
        );
        return (
            <div className="hover" style={style}>
                {/* {(tile.constructor as TileConstructor).displayName} ({tile.pos.x}, {tile.pos.y}) ({tile.darkness}) */}
                {(tile.constructor as TileConstructor).displayName}
                { children }
            </div>
        );
    }

    private leafInfo(tile: Tile) {
        return tile instanceof Leaf ? (
            <div>
                <div>{(1 / (tile.averageSpeed * LEAF_MAX_CHANCE)).toFixed(0)} turns per reaction</div>
                <div>{(1 / tile.averageEfficiency).toFixed(2)} water per sugar</div>
            </div>
        ) : null;
    }

    private airInfo(tile: Tile) {
        return tile instanceof Air ? <span>sunlight: {(tile.sunlight() * 100).toFixed(0)}%, co2: {(tile.co2() * 100).toFixed(0)}%</span> : null;
    }

    private energyInfo(tile: Tile) {
        if (hasEnergy(tile)) {
            return <span>{(tile.energy / CELL_ENERGY_MAX * 100).toFixed(0)}% energy</span>;
        }
        return null;
    }

    private inventoryInfo(tile: Tile) {
        if (hasInventory(tile)) {
            // return <span>{tile.inventory.water} / {tile.inventory.sugar.toFixed(0)} of {tile.inventory.capacity}</span>;
            const waterInfo = (tile.inventory.water > 0) ? <span>{tile.inventory.water} water</span> : null;
            const sugarInfo = (tile.inventory.sugar > 0) ? <span>{tile.inventory.sugar.toFixed(2)} sugar</span> : null;
            // const children = ([] as React.ReactNode[]).concat(
            //     ...[waterInfo, sugarInfo].map((infoEl) => {
            //         return infoEl == null ? [] : [", ", infoEl];
            //     }),
            // );
            return <span className="inventory-info">{waterInfo}{sugarInfo}</span>;
        }
    }

    private cellInfo(tile: Tile) {
        if (tile instanceof Cell) {
            if (tile.droopY * 200 > 1) {
                return <span>{(tile.droopY * 200).toFixed(0)}% droop</span>;
            } else {
                return null;
            }
        }
        return null;
    }
}
