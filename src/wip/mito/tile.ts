import { Vector2 } from "three";

import { Entity, world } from "./index";
import { hasInventory, HasInventory, Inventory } from "./inventory";

export const CELL_ENERGY_MAX = 500;
export const ENERGY_TO_SUGAR_RATIO = 500; // 500 energy per sugar
export const CELL_SUGAR_BUILD_COST = CELL_ENERGY_MAX / ENERGY_TO_SUGAR_RATIO;

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
                // // give water to neighbors that you're less than
                // if (tile.inventory.water < avgWater) {
                //     const diff = Math.floor((avgWater - tile.inventory.water) / (neighborsWithInventory.length + 1));
                //     this.inventory.give(tile.inventory, diff, 0);
                // }
                // take water from neighbors that you're bigger than
                if (tile.inventory.water > this.inventory.water) {
                    const diff = Math.floor((tile.inventory.water - this.inventory.water) / (neighborsWithInventory.length + 1));
                    tile.inventory.give(this.inventory, diff, 0);
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

export class Rock extends Tile {}

export class DeadCell extends Tile {}

export class Cell extends Tile implements HasEnergy {
    public energy: number = CELL_ENERGY_MAX;

    step() {
        super.step();
        this.energy -= 1;
        const neighbors = Array.from(world.tileNeighbors(this.pos).values());
        const neighborsAndSelf = [ ...neighbors, this ];
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
                // if (gotEnergy > 0) {
                //     console.log(`got ${gotEnergy}, now at ${this.energy}`);
                // }
            } else {
                break; // we're all full, eat no more
            }
        }
        // if still not full, try to get energy from neighboring energy
        if (this.energy < CELL_ENERGY_MAX) {
            const energeticNeighbors = neighborsAndSelf.filter((t) => hasEnergy(t)) as any as HasEnergy[];
            const averageEnergy = energeticNeighbors.reduce((energy, neighbor) => energy + neighbor.energy, 0) / energeticNeighbors.length;
            for (const neighbor of energeticNeighbors) {
                if (this.energy < CELL_ENERGY_MAX) {
                    let energyTransfer = 0;
                    // // take energy from neighbors who have more than you - this might be unstable w/o double buffering
                    // const targetEnergy = averageEnergy;
                    const targetEnergy = this.energy;
                    if (neighbor.energy > targetEnergy) {
                        energyTransfer = Math.floor((neighbor.energy - targetEnergy) / energeticNeighbors.length);
                        // if (neighbor.energy - energyTransfer < this.energy + energyTransfer) {
                        //     throw new Error("cell energy diffusion: result of transfer gives me more than target");
                        // }
                    }

                    // give energy to neighbors who have less than you
                    // if (neighbor.energy < averageEnergy) {
                    //     energyTransfer = -Math.floor((averageEnergy - neighbor.energy) / energeticNeighbors.length);
                    // }

                    if (Math.abs(energyTransfer) > 0) {
                        if (neighbor.energy - energyTransfer < 0) {
                            throw new Error("cell energy diffusion: taking more energy than available");
                        }
                        if (this.energy + energyTransfer > CELL_ENERGY_MAX) {
                            throw new Error("cell energy diffusion: taking more energy than i can carry");
                        }
                        // const boundedEnergy = Math.min(wantedEnergy, (neighbor.energy + this.energy) / 2);
                        this.energy += energyTransfer;
                        neighbor.energy -= energyTransfer;
                        // console.log(`transfering ${-energyTransfer} from ${this.energy} to ${neighbor.energy}`);
                    }
                } else {
                    break; // we're all full, eat no more
                }
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
                // transform only up to 1 at a time
                // careful this introduces fractional numbers right now - how to fix this?
                const transform = Math.min(tissueWater, 1) * reactionFactor;
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
        // const tissueNeighbors = Array.from(neighbors.values()).filter((e) => e instanceof Tissue) as Tissue[];
        // const soilNeighbors = Array.from(neighbors.values()).filter((e) => e instanceof Soil) as Soil[];
        // for (const soil of soilNeighbors) {

        // }
    }
}

export class Seed extends Cell {
    public inventory = new Inventory(10000);

    // seeds aggressively take the inventory from neighbors
    step() {
        super.step();
        const neighbors = world.tileNeighbors(this.pos);
        for (const [dir, neighbor] of neighbors) {
            if (hasInventory(neighbor)) {
                // LMAO
                neighbor.inventory.give(this.inventory, neighbor.inventory.water, neighbor.inventory.sugar);
            }
        }
    }
}
