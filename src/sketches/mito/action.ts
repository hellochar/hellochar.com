import { Vector2 } from "three";

import { Constructor } from "./constructor";
import { Cell, Transport } from "./game/tile";

export interface ActionStill {
    type: "still";
}

export interface ActionMove {
    type: "move";
    dir: Vector2;
}

export interface ActionBuild<T extends Cell = any> {
    type: "build";
    cellType: Constructor<T>;
    position: Vector2;
}

export interface ActionDeconstruct {
    type: "deconstruct";
    position: Vector2;
    force?: boolean;
}

export interface ActionBuildTransport {
    type: "build-transport";
    cellType: Constructor<Transport>;
    position: Vector2;
    dir: Vector2;
}

export interface ActionDrop {
    type: "drop";
    water: number;
    sugar: number;
}

export interface ActionNone {
    type: "none";
}

export interface ActionMultiple {
    type: "multiple";
    actions: Action[];
}

export type Action = ActionStill | ActionMove | ActionBuild | ActionDeconstruct | ActionBuildTransport | ActionDrop | ActionNone | ActionMultiple;
