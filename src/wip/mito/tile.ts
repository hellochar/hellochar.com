import { Vector2 } from "three";
import { Inventory } from "./inventory";

const CELL_ENERGY_MAX = 100;

export abstract class Tile {
    public constructor(public pos: Vector2) {}
}

export class Air extends Tile {
    public co2() {
        return 1;
    }

    public sunlight() {
        return 1;
    }
}

export class Soil extends Tile {
    public inventory = new Inventory(100);
    constructor(pos: Vector2, water: number = 0) {
        super(pos);
        this.inventory.change(water, 0);
    }
}

export class Cell extends Tile {
    public energy: number = CELL_ENERGY_MAX;
}

export class Tissue extends Cell {
    public inventory = new Inventory(100);
}

export class Leaf extends Cell {
    public step() {

    }
}

export class Root extends Cell {
    public step() {
        // const neighbors = World.tileNeighbors(this.pos);
        // for (const [dir, tile] of neighbors.entries()) {

        // }
    }
}
