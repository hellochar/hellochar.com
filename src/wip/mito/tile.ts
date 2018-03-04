import { Vector2 } from "three";

import { Entity, world } from "./index";
import { hasInventory, HasInventory, Inventory } from "./inventory";

export const CELL_ENERGY_MAX = 100;
const ENERGY_TO_SUGAR_RATIO = 10; // 10 energy per sugar

export interface HasEnergy {
    energy: number;
}

export function hasEnergy(e: any): e is HasEnergy {
    return typeof e.energy === "number";
}

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

export class Soil extends Tile implements HasInventory {
    public inventory = new Inventory(100);
    constructor(pos: Vector2, water: number = 0) {
        super(pos);
        this.inventory.change(water, 0);
    }
}

export class DeadCell extends Tile {}

export class Cell extends Tile implements HasEnergy {
    public energy: number = CELL_ENERGY_MAX;

    step() {
        super.step();
        this.energy -= 1;
        const neighborsAndSelf = [
            ...Array.from(world.tileNeighbors(this.pos).values()),
            this,
        ];
        for (const tile of neighborsAndSelf) {
            if (this.energy < CELL_ENERGY_MAX && hasInventory(tile)) {
                const wantedEnergy = CELL_ENERGY_MAX - this.energy;
                const wantedSugar = Math.min(
                    wantedEnergy / ENERGY_TO_SUGAR_RATIO,
                    tile.inventory.sugar,
                );
                tile.inventory.change(0, -wantedSugar);
                const gotEnergy = wantedSugar * ENERGY_TO_SUGAR_RATIO;
                this.energy += gotEnergy;
            } else {
                break; // we're all full, eat no more
            }
        }
        if (this.energy <= 0) {
            // die
            world.setTileAt(this.pos, new DeadCell(this.pos));
        }
    }
}

export class Tissue extends Cell implements HasInventory {
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
