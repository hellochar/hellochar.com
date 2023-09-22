import { Action, ActionMove } from "./action";
import { Constructor } from "./constructor";
import { DIRECTIONS } from "./directions";
import { Cell, Fruit, Leaf, Root, Tissue, Transport, Vein } from "./game/tile";

export const ACTION_KEYMAP: { [key: string]: Action } = {
    "1": {
        type: "drop",
        sugar: 0,
        water: 10, // hack hack we can assume max 100 water, it's fine
    },
    "2": {
        type: "drop",
        sugar: 10,
        water: 0, // hack hack we can assume max 100 water, it's fine
    },
    ".": {
        type: "still",
    },
};

export const MOVEMENT_KEYS: { [key: string]: ActionMove } = {
    w: {
        type: "move",
        dir: DIRECTIONS.n,
    },
    a: {
        type: "move",
        dir: DIRECTIONS.w,
    },
    s: {
        type: "move",
        dir: DIRECTIONS.s,
    },
    d: {
        type: "move",
        dir: DIRECTIONS.e,
    },
    q: {
        type: "move",
        dir: DIRECTIONS.nw,
    },
    e: {
        type: "move",
        dir: DIRECTIONS.ne,
    },
    z: {
        type: "move",
        dir: DIRECTIONS.sw,
    },
    c: {
        type: "move",
        dir: DIRECTIONS.se,
    },
};

export const MOVEMENTS = Object.keys(MOVEMENT_KEYS).map((key) => MOVEMENT_KEYS[key]);

export const BUILD_HOTKEYS: { [key: string]: Constructor<Cell> } = {
    t: Tissue,
    // f: Leaf,
    // r: Root,
    // T: Transport,
    // F: Fruit,
    // v: Vein,
};
