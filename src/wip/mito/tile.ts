import { Vector2 } from "three";

import { world } from "./index";
import { hasInventory, HasInventory, Inventory } from "./inventory";

const CELL_ENERGY_MAX = 100;

export abstract class Tile {
    public constructor(public pos: Vector2) {}

    // test tiles diffusing water around on same-type tiles
    public step() {
        if (hasInventory(this)) {
            const neighbors = world.tileNeighbors(this.pos);
            const neighborsWithInventory =
                Array.from(neighbors.values()).filter((tile) => {
                    return hasInventory(tile) && tile.constructor === this.constructor;
                }) as any as HasInventory[];

            let avgWater = this.inventory.water;
            neighborsWithInventory.forEach((tile) => {
                avgWater += tile.inventory.water;
            });
            avgWater /= (neighborsWithInventory.length + 1);

            for (const tile of neighborsWithInventory) {
                // give water to neighbors that you're less than
                if (tile.inventory.water < avgWater) {
                    const diff = Math.floor((avgWater - tile.inventory.water) / (neighborsWithInventory.length + 1));
                    this.inventory.give(tile.inventory, diff, 0);
                }
            }
        }
    }
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
