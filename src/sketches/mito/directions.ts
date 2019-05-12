import { Vector2 } from "three";

export const DIRECTIONS = {
    nw: new Vector2(-1, -1),
    w : new Vector2(-1,  0),
    sw: new Vector2(-1, +1),
    n : new Vector2( 0, -1),
    // new Vector2( 0,  0),
    s : new Vector2( 0, +1),
    ne: new Vector2(+1, -1),
    e : new Vector2(+1,  0),
    se: new Vector2(+1, +1),
};

export type Directions = keyof typeof DIRECTIONS;

export const DIRECTION_NAMES = Object.keys(DIRECTIONS) as Directions[];
export const DIRECTION_VALUES: Vector2[] = DIRECTION_NAMES.map((o) => DIRECTIONS[o]);
