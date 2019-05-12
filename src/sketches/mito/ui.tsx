import * as React from "react";

import { GameState, UIState, World } from "./index";
import Mito from "./index";
import { hasInventory } from "./inventory";
import { CELL_ENERGY_MAX, ENERGY_TO_SUGAR_RATIO, FOUNTAINS_TURNS_PER_WATER, LEAF_MAX_CHANCE, PLAYER_MAX_INVENTORY, SOIL_MAX_WATER, TISSUE_INVENTORY_CAPACITY, WATER_DIFFUSION_RATE } from "./params";
import { Air, Cell, Fruit, hasEnergy, Leaf, Root, Tile, Tissue, Transport } from "./tile";
import { Constructor } from "../../common/constructor";
import { BUILD_HOTKEYS } from "./keymap";

interface HUDProps {
    world: World;
    // onAutoplaceSet: (cellType: Constructor<Cell>) => void;
    onTryActionKey: (key: string) => void;
}

interface HUDState {
    autoplace: Constructor<Cell> | undefined;
    water: number;
    sugar: number;
    expanded?: boolean;
    uiState: UIState;
}

export class HUD extends React.Component<HUDProps, HUDState> {
    state: HUDState = {
        water: 0,
        sugar: 0,
        autoplace: undefined,
        expanded: true,
        uiState: { type: "main" },
    };

    public render() {
        const isMaxed = this.state.water + this.state.sugar > PLAYER_MAX_INVENTORY - 1;
        const isMaxedEl = <div className={`mito-inventory-maxed${isMaxed ? " is-maxed" : ""}`}>maxed</div>;

        return (
            <>
                <div className="mito-hud">
                    {this.renderFruitUI()}
                    {this.renderAllBuildButtons()}
                    {this.renderSecondEls()}
                    {this.renderDPad()}
                </div>
                <div className="mito-inventory">
                    {isMaxedEl}
                    <div className="mito-inventory-container">
                        {this.renderInventoryBar()}
                        {this.renderInventory()}
                    </div>
                </div>
                {this.renderUIState()}
                {this.renderAutoplacePopup()}
            </>
        );
    }

    ensureCanvasFocus(e: React.SyntheticEvent<any>) {
        e.preventDefault();
        const canvas = document.getElementsByTagName("canvas")[0];
        canvas.focus();
    }

    renderButton(key: string, text: string | null, props?: React.HTMLProps<HTMLDivElement>) {
        return (
            <div className="mito-hud-button mito-hud-build-item" onClick={(e) => {
                this.props.onTryActionKey(key);
                this.ensureCanvasFocus(e);
            }} {...props}>
                <span className="mito-hud-button-hotkey">{key}</span>{text}
            </div>
        );
    }

    renderBuildButton(key: string, props?: React.HTMLProps<HTMLDivElement>) {
        const cellType = BUILD_HOTKEYS[key];
        let text: string;
        if (cellType === Tissue) {
            text = `Build ${cellType.displayName}`;
        } else if (cellType === Leaf || cellType === Root) {
            text = `Build ${cellType.displayName}`;
        } else if (cellType === Fruit) {
            text = `Build ${cellType.displayName}`;
        } else if (cellType === Transport) {
            text = `Lay ${cellType.displayName}`;
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
        return this.renderButton(key, " - " + text, { ...props, style });
    }

    renderInventory() {
        return (
            <div className="mito-inventory-indicator">
                <span className="mito-inventory-water">
                    {this.state.water} water
                    </span>&nbsp;<span className="mito-inventory-sugar">
                    {this.state.sugar.toFixed(2)} sugar
                    </span>
            </div>
        )
    }

    renderInventoryBar() {
        const waterPercent = this.state.water / PLAYER_MAX_INVENTORY;
        const sugarPercent = this.state.sugar / PLAYER_MAX_INVENTORY;
        const emptyPercent = 1 - (this.state.water + this.state.sugar) / PLAYER_MAX_INVENTORY;

        const waterStyles: React.CSSProperties = { width: `${(waterPercent * 100)}%` };
        const sugarStyles: React.CSSProperties = { width: `${(sugarPercent * 100)}%` };
        const emptyStyles: React.CSSProperties = { width: `${(emptyPercent * 100)}%` };
        const inventoryBar = (
            <div className="mito-inventory-bar">
                <div style={waterStyles} className="mito-inventory-bar-water"></div>
                <div style={sugarStyles} className="mito-inventory-bar-sugar"></div>
                <div style={emptyStyles} className="mito-inventory-bar-empty"></div>
            </div>
        );
        return inventoryBar;
    }

    renderAllBuildButtons() {
        const buttons: JSX.Element[] = [];
        for (const key in BUILD_HOTKEYS) {
            if (key === "F") {
                // put fruit last, handle specially
                continue;
            }
            const el = this.renderBuildButton(key);
            if (el != null) {
                buttons.push(el);
            }
        }
        if (this.props.world.fruit == null) {
            buttons.push(this.renderBuildButton("F"));
        }
        return <div className="mito-hud-section mito-hud-section-build">{buttons}</div>;
    }

    public renderSecondEls() {
        return (
            <div className="mito-hud-section mito-hud-section-actions">
                {this.renderButton('1', " - Drop water")}
                {this.renderButton('2', " - Drop sugar")}
                {this.renderButton('.', " - Wait a turn")}
                {this.renderButton('?', " - Instructions")}
            </div>
        );
    }

    public renderDPad() {
        const els: JSX.Element[] = [];
        for (const key of "qwea.dzsc".split("")) {
            els.push(this.renderButton(key, null, {
                style: {

                },
            }));
        }
        return (
            <div className="mito-hud-section d-pad">
            {els}
            </div>
        );
    }

    public renderFruitUI() {
        const { world } = this.props;
        if (world.fruit != null) {
            return (
                <div className="mito-hud-section">
                You bear Fruit! {world.fruit.inventory.sugar.toFixed(2)} of {1000} sugar!
                </div>
            );
        }
    }

    public renderUIState() {
        if (this.state.uiState.type === "expanding") {
            const buttons: JSX.Element[] = [];
            for (const key in BUILD_HOTKEYS) {
                const cellType = BUILD_HOTKEYS[key];
                if (cellType === Fruit && this.props.world.fruit != null) {
                    // put fruit last, handle specially
                    continue;
                }
                if (cellType === Transport) {
                    continue;
                }
                const el = this.renderButton(key, cellType.displayName);

                if (el != null) {
                    buttons.push(el);
                }
            }
            buttons.push(this.renderButton("Esc", null));
            return (
                <div className="ui-popup ui-popup-bottom">
                    <span className="build-title">Build</span>
                    <div className="content button-row">
                        {buttons}
                    </div>
                </div>
            )
        }
    }

    public renderAutoplacePopup() {
        if (this.state.autoplace) {
            return (
                <div className="ui-popup ui-popup-left">
                    <div className="popup-autoplace content text">
                        Building {this.state.autoplace.displayName}
                        {this.renderButton("Esc", null)}
                    </div>
                </div>
            );
        }
    }
}

export interface GameStackState {
    state: GameState;
}

export class GameStack extends React.Component<{ mito: Mito }, GameStackState> {
    state: GameStackState = {
        state: "main",
    };

    handlePlay = () => {
        this.props.mito.gameState = "main";
    }

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
        } else if (this.state.state === "lose") {
            return (
                <div className="screen-lose" style={style}>
                You lost!
                </div>
            );
        } else if (this.state.state === "instructions") {
            return <Instructions play={this.handlePlay} />;
        }
    }
}

interface InstructionsProps {
    play: () => void;
}

class Instructions extends React.PureComponent<InstructionsProps, {}> {
    render() {
        return (
            <div className="mito-instructions">
                <div className="mito-instructions-container">
                    <div className="esc" onClick={() => this.props.play()}>Back (Esc)</div>
                    <h1>Mito</h1>
                    <div className="play-button" onClick={() => this.props.play()}>
                        Play
                    </div>
                    <p>
                    <ol>
                        <li>Build Tissue to expand your reach (press t and walk into empty space).</li>
                        <li>Build Roots (press r) underground to suck up adjacent water.</li>
                        <li>Build Leaves (press l) above ground and drop water (press 1) to convert water into sugar.</li>
                        <li><b>Win the game by building and loading the Fruit with 1000 sugar.</b></li>
                        <li>Click around to see the different properties of each tile.</li>
                        <li>Build leaves early.</li>
                        <li>Leaves higher up have better water/sugar ratios, determined by the co2 percentage in the air.</li>
                        <li>Explore underground for water reservoires and Fountains.</li>
                        <li>Build transports (capital T) to carry water back up the plant.</li>
                        <li>You can scroll out infinitely far.</li>
                    </ol>
                    </p>
                    <h3>You</h3>
                    <p>
                        You can carry max {PLAYER_MAX_INVENTORY} resources, and you automatically suck in any resources you're standing over.
                        You can only walk on Tissue (and Transport).
                        You start at the center of the map, with soil below and air above.
                    </p>
                    <h3>Soil and Underground</h3>
                    <p>
                        Underground, Soil holds water, rocks block your way, and occasionally Fountains (at the very bottom) are a permanent source of water.
                        Soil holds up to {SOIL_MAX_WATER} water at a time.
                        Fountains emit one water per {FOUNTAINS_TURNS_PER_WATER} turns.
                    </p>
                    <h3>Air and Aboveground</h3>
                    <p>
                        Aboveground, Air provides both sunlight and co2.
                        Sunlight determines the ratio of waters-per-sugar at which reactions happen and are affected by shadows.
                        Co2 determines the speed of reaction and gets better as you build higher up. Orange is low co2, blue is high co2.
                        Gravity will pull down on your structures, so make sure they're structurally sound.
                        Your structures cast shadows on the leaves below in relation to the sun, which gently sways left to right.
                    </p>
                    <h3>Water</h3>
                    <p>
                        Water is one of the main two resources.
                        Water slowly diffuses from high to low densities (difference 2 required) at about 1 unit per {(1 / WATER_DIFFUSION_RATE).toFixed(0)} turns.
                        Obtain water in the ground through Roots. Leaves require water to photosynthesize. You require water to build.
                    </p>
                    <h3>Sugar</h3>
                    <p>
                        Sugar is the other main resource. Sugar does not diffuse. Leaves convert water into sugar. Obtain sugar by putting
                        water next to leaves. Cells require sugar to survive. You require sugar to build.
                    </p>
                    <h3>Building</h3>
                    <p>
                        Build Tissue, Leaves, Roots, and The Fruit by toggling "build mode" on and walking into Air or Soil.
                        Build Transport over existing tissue by walking around. Building costs 1 sugar and 1 water.
                        You can build Tissue over Leaves and Roots - be careful!
                        When you build above ground, Cells will Droop if they're not properly supported underneath them.
                    </p>
                    <h3>Cells</h3>
                    <p>
                        All cells require energy upkeep and will automatically eat sugar on their tile, or get energy from their neighbors.
                        Each cell consumes 1 sugar every {ENERGY_TO_SUGAR_RATIO} turns.
                    </p>
                    <h3>Tissue</h3>
                    <p>
                        Tissue connects your plant together, you may only walk on Tissue. Each Tissue carries up to {TISSUE_INVENTORY_CAPACITY} resources.
                    </p>
                    <h3>Roots</h3>
                    <p>
                        Roots are the only way to get water. Each turn Roots transport one water per neighboring soil into the Tissue in the
                        opposite direction (so the Tissue North of the root get water in the South tile). This is called a Pairing.
                    </p>
                    <h3>Leaves</h3>
                    <p>
                        When exposed to Air, Leaves convert water to sugar. Leaves also use Pairings between opposite direction Air/Tissue with water.
                        In perfect co2, leave produce on average 1 sugar per {(1 / LEAF_MAX_CHANCE).toFixed(0)} turns per pair.
                        Leaf efficiency is heavily influenced by co2 and sunlight of its neighboring Air.
                        If your leaf is in too much shadow, it will not be able to photosynthesize.
                        Leaves higher up produce sugar faster.
                    </p>
                    <h3>Transport</h3>
                    <p>
                        Transports move 1 water from its own Tile in the direction it was laid per turn, as well as moving you. Transport hungers at double speed.
                    </p>
                    <h3>The Fruit</h3>
                    <p>
                        You can only build one Fruit, and it is the goal of the game to fill it up with resources. Fruit has up to 1000 sugar storage
                        and aggressively pulls in every available sugar in its surrounding vicinity.
                    </p>
                    {this.renderCredit()}
                </div>
            </div>
        );
    }

    renderCredit() {
        return (
            <>
                <h2>Attribution</h2>
                <p>
                    Tiles: <a href="http://kenney.nl/assets?s=roguelike" target="_blank">Kenney.nl Roguelike Assets</a>
                </p>
                <p>
                    Pop sound when leaves convert: <a href="http://soundbible.com/2067-Blop.html" target="_blank">Blop by Mark DiAngelo</a> (<a href="https://creativecommons.org/licenses/by/3.0/us/">CC BY 3.0 US</a>)
                </p>
                <p>
                    Perlin noise: <a href="https://github.com/josephg/noisejs" target="_blank">josephg/noisejs</a>
                </p>
                <p>
                    Part of 7drl 2018: <a href="http://7drl.org/" target="_blank">http://7drl.org/</a>
                </p>
                <p>
                    Fruit icon: <a href='https://www.freepik.com/free-vector/fruits-set-pixel-icons_1001072.htm'>Designed by Freepik</a>
                </p>
            </>
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

        const spans = [this.energyInfo(tile), this.inventoryInfo(tile), this.cellInfo(tile), this.rootInfo(tile), this.leafInfo(tile), this.airInfo(tile)];
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

    private rootInfo(tile: Tile) {
        return tile instanceof Root ? (
            <>
            <div>{tile.cooldown} turns until next water suck</div>
            <div>{tile.waterTransferAmount.toFixed(0)} water transfer per round</div>
            </>
        ) : null
    }

    private leafInfo(tile: Tile) {
        return tile instanceof Leaf ? (
            <>
                <div>{(1 / (tile.averageSpeed * LEAF_MAX_CHANCE)).toFixed(0)} turns per reaction</div>
                <div>{(1 / tile.averageEfficiency).toFixed(2)} water per sugar</div>
            </>
        ) : null;
    }

    private airInfo(tile: Tile) {
        return tile instanceof Air ? <>sunlight: {(tile.sunlight() * 100).toFixed(0)}%, co2: {(tile.co2() * 100).toFixed(0)}%</> : null;
    }

    private energyInfo(tile: Tile) {
        if (hasEnergy(tile)) {
            return <>{(tile.energy / CELL_ENERGY_MAX * 100).toFixed(0)}% energy</>;
        }
        return null;
    }

    private inventoryInfo(tile: Tile) {
        if (hasInventory(tile)) {
            // return <span>{tile.inventory.water} / {tile.inventory.sugar.toFixed(0)} of {tile.inventory.capacity}</span>;
            const waterInfo = (tile.inventory.water > 0) ? <>{tile.inventory.water} water</> : null;
            const sugarInfo = (tile.inventory.sugar > 0) ? <>{tile.inventory.sugar.toFixed(2)} sugar</> : null;
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
                return <>{(tile.droopY * 200).toFixed(0)}% droop</>;
            } else {
                return null;
            }
        }
        return null;
    }
}
