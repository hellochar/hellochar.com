import * as React from "react";

import { Action } from "./action";
import { ACTION_KEYMAP, BUILD_HOTKEYS, Constructor, DIRECTION_NAMES, GameState, world } from "./index";
import { hasInventory } from "./inventory";
import { Air, Cell, CELL_ENERGY_MAX, Fruit, hasEnergy, Leaf, LEAF_MAX_CHANCE, Root, Tile, Tissue, Transport } from "./tile";

interface HUDProps {
    // onAutoplaceSet: (cellType: Constructor<Cell>) => void;
    onTryActionKey: (key: string) => void;
}

interface HUDState {
    autoplace: Constructor<Cell> | undefined;
    water: number;
    sugar: number;
}

export class HUD extends React.Component<HUDProps, HUDState> {
    state: HUDState = {
        water: 0,
        sugar: 0,
        autoplace: undefined,
    };

    ensureCanvasFocus(e: React.SyntheticEvent<any>) {
        e.preventDefault();
        const canvas = document.getElementsByTagName("canvas")[0];
        canvas.focus();
    }

    renderButton(key: string, text?: string, props?: React.HTMLProps<HTMLDivElement>) {
        return (
            <div className="mito-hud-button mito-hud-build-item" onClick={(e) => {
                this.props.onTryActionKey(key);
                this.ensureCanvasFocus(e);
            }} {...props}>
                <span className="mito-hud-button-hotkey">{key}</span>{text != null ? " - " + text : null}
            </div>
        );
    }

    renderBuildButton(key: string, props?: React.HTMLProps<HTMLDivElement>) {
        const cellType = BUILD_HOTKEYS[key];
        // skip building fruit when one already exists
        if (world.fruit != null && cellType === Fruit) {
            return null;
        }
        let text: string;
        if (cellType === Tissue) {
            text = `Build ${cellType.displayName}`;
        } else if (cellType === Leaf || cellType === Root) {
            text = `Build one ${cellType.displayName}`;
        } else if (cellType === Fruit) {
            text = `Build the ${cellType.displayName}`;
        } else if (cellType === Transport) {
            text = `Lay ${cellType.displayName} underneath`;
        } else {
            text = `Build ${cellType.displayName}`;
        }
        const style: React.CSSProperties = {...(props || { style: {} }).style};
        if (this.state.autoplace === cellType) {
            style.fontWeight = "bold";
            style.textDecoration = "underline";
            style.color = "rgb(45, 220, 40)";
            if (this.state.water === 0) {
                text += " (need water!)";
                style.color = "red";
            }
            if (this.state.sugar === 0) {
                text += " (need sugar!)";
                style.color = "red";
            }
        }
        return this.renderButton(key, text, { ...props, style });
    }

    renderAllBuildButtons() {
        const buttons: JSX.Element[] = [];
        for (const key in BUILD_HOTKEYS) {
            if (key === "F") {
                // fruit is coverec by the fruit ui
                continue;
            }
            const el = this.renderBuildButton(key);
            if (el != null) {
                buttons.push(el);
            }
        }
        return buttons;
    }

    public renderSecondEls() {
        return [
            this.renderButton('1', "Drop water"),
            this.renderButton('2', "Drop sugar"),
            this.renderButton('.', "Wait a turn"),
        ];
    }

    public renderDPad() {
        const els: JSX.Element[] = [];
        for (const key of "qwea.dzsc".split("")) {
            const action = ACTION_KEYMAP[key];
            els.push(this.renderButton(key, undefined, {
                style: {

                },
            }));
        }
        return (
            <div className="d-pad">
            {els}
            </div>
        );
    }

    public renderFruitUI() {
        if (world.fruit == null) {
            return <div>No Fruit. {this.renderBuildButton("F", { style: { display: "inline-block" }})}</div>;
        } else {
            return <div>You bear Fruit! {world.fruit.inventory.sugar} of 1000 sugar!</div>;
        }
    }

    public render() {
        const hudStyles: React.CSSProperties = {
            background: "rgba(255, 255, 255, 0.8)",
            padding: "10px",
        };
        return (
            <div className="mito-hud" style={hudStyles}>
                <div style={{fontWeight: "bold"}}>
                    <span className="mito-hud-water">{this.state.water} water</span>, <span className="mito-hud-sugar">{this.state.sugar.toFixed(2)} sugar</span>
                </div>
                <br />
                {this.renderFruitUI()}
                <br />
                {this.renderAllBuildButtons()}
                <br />
                {this.renderSecondEls()}
                <br />
                <div className="classybr" />
                <br />
                {this.renderDPad()}
                <br />
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
                {(tile.constructor as Constructor<Tile>).displayName}
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
