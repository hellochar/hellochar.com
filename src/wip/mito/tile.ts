import { Vector2 } from "three";

import { world } from "./index";
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
        const neighbors = world.tileNeighbors(this.pos);
        for (const [dir, tile] of neighbors.entries()) {
            const oppositeTile = world.tileAt(this.pos.x - dir.x, this.pos.y - dir.y);
            if (tile instanceof Air &&
                oppositeTile instanceof Tissue) {
                const air = tile;
                const tissue = oppositeTile;
                // 0 to 1
                const reactionFactor = air.co2() * air.sunlight();
                const tissueWater = tissue.inventory.water;
                const transform = Math.min(tissueWater, 10) * reactionFactor;
                tissue.inventory.water -= transform;
                tissue.inventory.sugar += transform;
            }
        }
    }
}

export class Root extends Cell {
    public step() {
        const neighbors = world.tileNeighbors(this.pos);
        for (const [dir, tile] of neighbors.entries()) {
            const oppositeTile = world.tileAt(this.pos.x - dir.x, this.pos.y - dir.y);
            if (tile instanceof Soil &&
                oppositeTile instanceof Tissue) {
                    const soilWater = tile.inventory.water;
                    const tissueWater = oppositeTile.inventory.water;
                    const transferAmount = Math.ceil(Math.max(0, soilWater - tissueWater) / 2);
                    tile.inventory.give(oppositeTile.inventory, transferAmount, 0);
            }
        }
    }
}
