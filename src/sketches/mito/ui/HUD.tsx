import * as classnames from "classnames";
import * as React from "react";

import { Constructor } from "../constructor";
import { Cell, Fruit, Leaf, Root, Tissue, Transport } from "../game/tile";
import { World } from "../game/world";
import { UIState } from "../index";
import { BUILD_HOTKEYS } from "../keymap";
import { params } from "../params";

export interface HUDProps {
    world: World;
    autoplace: Constructor<Cell> | undefined;
    water: number;
    sugar: number;
    expanded?: boolean;
    uiState: UIState;
    isTutorialFinished: boolean;
    // onAutoplaceSet: (cellType: Constructor<Cell>) => void;
    onTryActionKey: (key: string) => void;
}

export class HUD extends React.PureComponent<HUDProps> {
    public render() {
        const isMaxed = this.props.water + this.props.sugar > params.maxResources - 1;
        const isMaxedEl = <div className={`mito-inventory-maxed${isMaxed ? " is-maxed" : ""}`}>maxed</div>;
        return (<>
            <div className={classnames("mito-hud", { hidden: !this.props.isTutorialFinished })}>

                {this.renderFruitUI()}
                {this.renderAllBuildButtons()}
                {this.renderSecondEls()}
                {this.renderDPad()}
            </div>
            <div className={classnames("mito-inventory", { hidden: !this.props.isTutorialFinished })}>
                {isMaxedEl}
                <div className="mito-inventory-container">
                    {this.renderInventoryBar()}
                    {this.renderInventory()}
                </div>
            </div>
            {this.renderUIState()}
            {this.renderAutoplacePopup()}
        </>);
    }
    ensureCanvasFocus(e: React.SyntheticEvent<any>) {
        e.preventDefault();
        const canvas = document.getElementsByTagName("canvas")[0];
        canvas.focus();
    }
    renderButton(key: string, text: string | null, props?: React.HTMLProps<HTMLDivElement>) {
        return (<div className="mito-hud-button mito-hud-build-item" onClick={(e) => {
            this.props.onTryActionKey(key);
            this.ensureCanvasFocus(e);
        }} {...props}>
            <span className="mito-hud-button-hotkey">{key}</span>{text}
        </div>);
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
        const style: React.CSSProperties = { ...(props || { style: {} }).style };
        if (this.props.autoplace === cellType) {
            style.fontWeight = "bold";
            style.textDecoration = "underline";
            style.color = "rgb(45, 220, 40)";
            if (this.props.water === 0) {
                text += " (need water!)";
                style.color = "red";
            }
            if (this.props.sugar === 0) {
                text += " (need sugar!)";
                style.color = "red";
            }
        }
        return this.renderButton(key, " - " + text, { ...props, style });
    }
    renderInventory() {
        return (<div className="mito-inventory-indicator">
            <span className="mito-inventory-water">
                {this.props.water} water
                    </span>&nbsp;<span className="mito-inventory-sugar">
                {this.props.sugar.toFixed(2)} sugar
                    </span>
        </div>);
    }
    renderInventoryBar() {
        const waterPercent = this.props.water / params.maxResources;
        const sugarPercent = this.props.sugar / params.maxResources;
        const emptyPercent = 1 - (this.props.water + this.props.sugar) / params.maxResources;
        const waterStyles: React.CSSProperties = { width: `${(waterPercent * 100)}%` };
        const sugarStyles: React.CSSProperties = { width: `${(sugarPercent * 100)}%` };
        const emptyStyles: React.CSSProperties = { width: `${(emptyPercent * 100)}%` };
        const inventoryBar = (<div className="mito-inventory-bar">
            <div style={waterStyles} className="mito-inventory-bar-water"></div>
            <div style={sugarStyles} className="mito-inventory-bar-sugar"></div>
            <div style={emptyStyles} className="mito-inventory-bar-empty"></div>
        </div>);
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
        return (<div className="mito-hud-section mito-hud-section-actions">
            {this.renderButton('1', " - Drop water")}
            {this.renderButton('2', " - Drop sugar")}
            {this.renderButton('.', " - Wait a turn")}
            {this.renderButton('?', " - Instructions")}
        </div>);
    }
    public renderDPad() {
        const els: JSX.Element[] = [];
        for (const key of "qwea.dzsc".split("")) {
            els.push(this.renderButton(key, null, {
                style: {},
            }));
        }
        return (<div className="mito-hud-section d-pad">
            {els}
        </div>);
    }
    // public renderTime() {
    //     return <div className="mito-hud-section">{this.props.world.time}</div>;
    // }
    public renderFruitUI() {
        const { world } = this.props;
        if (world.fruit != null) {
            return (<div className="mito-hud-section">
                You bear Fruit! {world.fruit.inventory.sugar.toFixed(2)} of {1000} sugar!
                </div>);
        }
    }
    public renderUIState() {
        if (this.props.uiState.type === "expanding") {
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
                    <div className="connector-line"></div>
                    <span className="popup-title">Build</span>
                    <div className="popup-content popup-row">
                        {buttons}
                    </div>
                </div>
            );
        }
    }
    public renderAutoplacePopup() {
        if (this.props.autoplace) {
            return (<div className="ui-popup ui-popup-left">
                <div className="popup-autoplace popup-content popup-text">
                    Building {this.props.autoplace.displayName}
                    {this.renderButton("Esc", null)}
                </div>
            </div>);
        }
    }
}
