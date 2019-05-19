import { Vector2 } from "three";

import { Noise } from "../../../common/perlin";
import { map } from "../../../math/index";
import { DIRECTIONS } from "../directions";
import { height, width } from "../index";
import { hasInventory, HasInventory, Inventory } from "../inventory";
import { params } from "../params";
import { World } from "./world";

export interface HasEnergy {
    energy: number;
}

export function hasEnergy<T>(e: T): e is HasEnergy & T {
    return typeof (e as any).energy === "number";
}

export abstract class Tile {
    static displayName = "Tile";
    public isObstacle = false;
    public darkness = Infinity;
    get diffusionWater() {
        return (this.constructor as any).diffusionWater;
    }

    get diffusionSugar() {
        return (this.constructor as any).diffusionWater;
    }

    public constructor(public pos: Vector2, public world: World) {
        if (world == null) {
            throw new Error("null world!");
        }
    }

    public lightAmount() {
        return Math.sqrt(Math.min(Math.max(map(1 - this.darkness, 0, 1, 0, 1), 0), 1));
    }

    // test tiles diffusing water around on same-type tiles
    public step() {
        const neighbors = this.world.tileNeighbors(this.pos);
        if (this instanceof Cell) {
            this.darkness = 0;
        } else {
            const minDarkness = Array.from(neighbors.values()).reduce((d, t) => {
                const contrib = Math.max(0.2, map(this.pos.y, height / 2, height, 0.2, 1));
                const darknessFromNeighbor = t instanceof Rock ? Infinity : t.darkness + contrib;
                if (t instanceof Cell) {
                    return 0;
                } else {
                    return Math.min(d, darknessFromNeighbor);
                }
            }, this.darkness);
            this.darkness = minDarkness;
            const cellHere = this.world.cellAt(this.pos.x, this.pos.y) != null;
            if (cellHere) {
                console.error("stepping environmental tile even when a cell is on-top:", cellHere);
            }
        }
        if (hasInventory(this)) {
            const diffusionNeighbors = this.diffusionNeighbors(neighbors);
            for (const tile of diffusionNeighbors) {
                // take water from neighbors that have more water than you
                if (this.diffusionWater != null) {
                    if (tile.inventory.water > this.inventory.water) {
                        this.diffuseWater(tile);
                    }
                }
                if (this.diffusionSugar != null) {
                    if (tile.inventory.sugar > this.inventory.sugar) {
                        this.diffuseSugar(tile);
                    }
                }
            }

            this.resourceMoveGravity();
        }
    }

    diffusionNeighbors(neighbors: Map<Vector2, Tile>) {
        return Array.from(neighbors.values()).filter((tile) => {
            return hasInventory(tile) && (
                isSubclass(tile, this) ||
                // this allows tissue, Roots, Transports, etc. to diffuse water
                (tile instanceof Cell && this instanceof Cell)
            );
        }) as Array<Tile & HasInventory>;
    }

    diffuseWater(giver: HasInventory) {
        if (hasInventory(this)) {
            if (params.waterDiffusionType === "continuous") {
                const diffusionAmount = (giver.inventory.water - this.inventory.water) * this.diffusionWater;
                giver.inventory.give(this.inventory, diffusionAmount, 0);
            } else {
                const waterDiff = giver.inventory.water - this.inventory.water;
                if (waterDiff > 1 && Math.random() < waterDiff * this.diffusionWater) {
                    giver.inventory.give(this.inventory, 1, 0);
                }
            }
        }
    }

    diffuseSugar(giver: HasInventory) {
        if (hasInventory(this)) {
            const diffusionAmount = (giver.inventory.sugar - this.inventory.sugar) * this.diffusionSugar;
            giver.inventory.give(this.inventory, 0, diffusionAmount);
        }
    }

    resourceMoveGravity() {
        if (hasInventory(this)) {
            const upperNeighbor = this.world.tileAt(this.pos.x, this.pos.y - 1);
            if (upperNeighbor && hasInventory(upperNeighbor) && isSubclass(upperNeighbor, this) && !(this instanceof Cell)) {
                upperNeighbor.inventory.give(this.inventory, params.waterGravityPerTurn, 0);
            }
        }
    }
}

const noiseCo2 = new Noise();
export class Air extends Tile {
    static displayName = "Air";
    public sunlightCached: number = 1;
    public _co2: number;
    public constructor(public pos: Vector2, world: World) {
        super(pos, world);
        this.darkness = 0;
        this._co2 = this.computeCo2();
    }

    private computeCo2() {
        const base = map(this.pos.y, height / 2, 0, params.floorCo2, 1.15);
        const scaleX = map(this.pos.y, height / 2, 0, 4, 9);
        // const offset = noiseCo2.perlin3(94.2321 - this.pos.x / scaleX, 3221 - this.pos.y / 2.5, world.time / 5 + 93.1) * 0.2;
        const time = this.world == null ? 0 : this.world.time;
        const offset = noiseCo2.perlin3(94.231 + (this.pos.x - width / 2) / scaleX, 2312 + this.pos.y / 8, time / 1000 + 93.1) * 0.25;
        // don't compute dark/light or water diffusion
        return Math.max(Math.min(base + offset, 1), Math.min(0.4, params.floorCo2 * 0.75));
    }

    public lightAmount() {
        return this.sunlight();
    }

    step() {
        this._co2 = this.computeCo2();
    }

    public co2() {
        return this._co2;
    }

    public sunlight() {
        return this.sunlightCached;
    }
}

export class Soil extends Tile implements HasInventory {
    static displayName = "Soil";
    static diffusionWater = params.waterDiffusionRate;
    public inventory = new Inventory(params.soilMaxWater);
    constructor(pos: Vector2, water: number = 0, world: World) {
        super(pos, world);
        this.inventory.add(water, 0);
    }
}

export class Rock extends Tile {
    isObstacle = true;
    static displayName = "Rock";
}

export class DeadCell extends Tile {
    static displayName = "Dead Cell";
}

export class Fountain extends Soil {
    static displayName = "Fountain";
    isObstacle = true;
    private cooldown = 0;
    constructor(pos: Vector2, water: number = 0, world: World, public turnsPerWater: number) {
        super(pos, water, world);
    }
    step() {
        super.step();
        if (this.cooldown > 0) {
            this.cooldown--;
        }
        if (this.inventory.space() > 1 && this.cooldown <= 0) {
            // just constantly give yourself water
            this.inventory.add(1, 0);
            this.cooldown = this.turnsPerWater;
        }
    }
}

interface MetabolismState {
    type: "eating" | "not-eating";
    duration: number;
}
export class Cell extends Tile implements HasEnergy {
    static displayName = "Cell";
    static diffusionWater = params.cellDiffusionWater;
    static diffusionSugar = params.sugarDiffusionRate;
    public energy: number = params.cellEnergyMax;
    public darkness = 0;
    // public metabolism: MetabolismState = {
    //     type: "not-eating",
    //     duration: 0,
    // };
    // offset [-0.5, 0.5] means you're still "inside" this cell, going out of it will break you
    // public offset = new Vector2();
    public droopY = 0;

    // private stepMetabolism() {
    //     // transition from not eating to eating
    //     if (this.metabolism.type === "not-eating") {
    //         // const shouldEat = this.energy < CELL_ENERGY_MAX / 2 && this.metabolism.duration > 25;
    //         const shouldEat = this.energy < CELL_ENERGY_MAX / 2;
    //         if (shouldEat) {
    //             this.metabolism = {
    //                 type: "eating",
    //                 duration: 0,
    //             };
    //         }
    //     } else {
    //         const shouldStopEating = this.metabolism.duration > 30;
    //         if (shouldStopEating) {
    //             this.metabolism = {
    //                 type: "not-eating",
    //                 duration: 0,
    //             };
    //         }
    //     }
    //     this.metabolism.duration++;
    // }

    step() {
        super.step();
        this.energy -= 1;
        const tileNeighbors = this.world.tileNeighbors(this.pos);
        const neighbors = Array.from(tileNeighbors.values());
        const neighborsAndSelf = [ ...neighbors, this ];
        // this.stepMetabolism();
        // if (this.metabolism.type === "eating") {
        if (true) {
            for (const tile of neighborsAndSelf) {
                if (hasInventory(tile) && !(tile instanceof Fruit)) {
                    if (this.energy < params.cellEnergyMax) {
                        const wantedEnergy = params.cellEnergyMax - this.energy;
                        const wantedSugar = Math.min(
                            wantedEnergy / params.cellEnergyMax,
                            tile.inventory.sugar,
                        );
                        tile.inventory.add(0, -wantedSugar);
                        const gotEnergy = wantedSugar * params.cellEnergyMax;
                        this.energy += gotEnergy;
                        // if (gotEnergy > 0) {
                        //     console.log(`got ${gotEnergy}, now at ${this.energy}`);
                        // }
                    } else {
                        break; // we're all full, eat no more
                    }
                }
            }
            if (this.energy < params.cellEnergyMax) {
                const energeticNeighbors = neighborsAndSelf.filter((t) => hasEnergy(t)) as any as HasEnergy[];
                const averageEnergy = energeticNeighbors.reduce((energy, neighbor) => energy + neighbor.energy, 0) / energeticNeighbors.length;
                for (const neighbor of energeticNeighbors) {
                    if (this.energy < params.cellEnergyMax) {
                        let energyTransfer = 0;
                        // // take energy from neighbors who have more than you - this might be unstable w/o double buffering
                        // const targetEnergy = averageEnergy;
                        if (neighbor.energy > this.energy) {
                            // energyTransfer = Math.floor((neighbor.energy - this.energy) / energeticNeighbors.length);
                            energyTransfer = Math.floor((neighbor.energy - this.energy) * 0.25);
                            // if (neighbor.energy - energyTransfer < this.energy + energyTransfer) {
                            //     throw new Error("cell energy diffusion: result of transfer gives me more than target");
                            // }
                            if (neighbor.energy - energyTransfer < 0) {
                                throw new Error("cell energy diffusion: taking more energy than available");
                            }
                            if (this.energy + energyTransfer > params.cellEnergyMax) {
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
        }

        // this.stepStress(tileNeighbors);
        this.stepDroop(tileNeighbors);
        if (this.droopY > 0.5) {
            // make the player ride the train!
            if (this.world.player.pos.equals(this.pos)) {
                this.world.player.pos.y += 1;
            }
            this.world.maybeRemoveCellAt(this.pos);
            this.pos.y += 1;
            this.droopY -= 1;
            // lol whatever lets just test it out
            this.world.setTileAt(this.pos, this);
        }

        if (this.energy <= 0) {
            // die
            this.world.setTileAt(this.pos, new DeadCell(this.pos, this.world));
        }
    }

    // stepStress(tileNeighbors: Map<Vector2, Tile>) {
    //     // start with +y down for gravity
    //     const totalForce = new Vector2(0, 1);
    //     // pretend like you're spring connected to nearby cells,
    //     // and find the equilibrium position as your offset
    //     for (const [dir, neighbor] of tileNeighbors) {
    //         let springTightness = 0;
    //         // neighbor's world position
    //         let neighborX = neighbor.pos.x,
    //             neighborY = neighbor.pos.y;
    //         if (neighbor instanceof Cell) {
    //             neighborX += neighbor.offset.x;
    //             neighborY += neighbor.offset.y;
    //             springTightness = 0.1;
    //         } else if (neighbor instanceof Rock || neighbor instanceof Soil) {
    //             springTightness = 1;
    //         }
    //         const offX = this.pos.x + this.offset.x - neighborX;
    //         const offY = this.pos.y + this.offset.y - neighborY;
    //         // world offset
    //         const offset = new Vector2(offX, offY);
    //         totalForce.x += offX * springTightness;
    //         totalForce.y += offY * springTightness;
    //     }

    //     this.offset.x += totalForce.x * 0.01;
    //     this.offset.y += totalForce.y * 0.01;
    // }

    stepDroop(tileNeighbors: Map<Vector2, Tile>) {
        const below = tileNeighbors.get(DIRECTIONS.s)!;
        const belowLeft = tileNeighbors.get(DIRECTIONS.sw)!;
        const belowRight = tileNeighbors.get(DIRECTIONS.se)!;

        const left = tileNeighbors.get(DIRECTIONS.w)!;
        const right = tileNeighbors.get(DIRECTIONS.e)!;

        const above = tileNeighbors.get(DIRECTIONS.n)!;
        const aboveLeft = tileNeighbors.get(DIRECTIONS.nw)!;
        const aboveRight = tileNeighbors.get(DIRECTIONS.ne)!;

        this.droopY += params.droop;
        if (this.energy < params.cellEnergyMax / 2) {
            this.droopY += params.droop;
        }

        let hasSupportBelow = false;
        for (const cell of [below, belowLeft, belowRight]) {
            if (cell instanceof Rock || cell instanceof Soil) {
                this.droopY = Math.min(this.droopY, 0);
                return;
            } else if (cell instanceof Cell) {
                this.droopY = Math.min(this.droopY, cell.droopY);
                hasSupportBelow = true;
                return;
            }
        }

        const springNeighborCells = [aboveLeft, above, aboveRight, left, right, this].filter((n) => n instanceof Cell) as Cell[];

        // special case - if there's no support and nothing below me, just start freefalling
        if (!hasSupportBelow && springNeighborCells.length === 1) {
            this.droopY += 1;
        } else {
            this.droopY = springNeighborCells.reduce((sum, n) => sum + n.droopY, 0) / springNeighborCells.length;
        }
    }
}

export class Tissue extends Cell implements HasInventory {
    static displayName = "Tissue";
    public inventory = new Inventory(params.tissueInventoryCapacity);
}

interface IHasTilePairs {
    tilePairs: Vector2[];
}

export function hasTilePairs(t: any): t is IHasTilePairs {
    return t.tilePairs instanceof Array;
}

export class Leaf extends Cell {
    static displayName = "Leaf";
    public averageEfficiency = 0;
    public averageSpeed = 0;
    public didConvert = false;
    public sugarConverted = 0;
    public tilePairs: Vector2[] = []; // implied that the opposite direction is connected

    public step() {
        super.step();
        this.didConvert = false;
        const neighbors = this.world.tileNeighbors(this.pos);
        this.averageEfficiency = 0;
        this.averageSpeed = 0;
        this.sugarConverted = 0;
        let numAir = 0;
        this.tilePairs = [];

        for (const [dir, tile] of neighbors.entries()) {
            const oppositeTile = this.world.tileAt(this.pos.x - dir.x, this.pos.y - dir.y);
            if (tile instanceof Air &&
                oppositeTile instanceof Tissue) {
                numAir += 1;
                this.tilePairs.push(dir);
                const air = tile;
                const tissue = oppositeTile;

                // do the reaction slower in dark places
                const speed = air.sunlight();

                // gives much less sugar lower down
                const efficiency = air.co2();

                this.averageEfficiency += efficiency;
                this.averageSpeed += speed;

                // in prime conditions:
                //      our rate of conversion is speed * params.leafReactionRate
                //      we get 1 sugar at 1/efficiencyRatio (> 1) water
                // if we have less than 1/efficiencyRatio water
                //      our rate of conversion scales down proportionally
                //      on conversion, we use up all the available water and get the corresponding amount of sugar
                const bestEfficiencyWater = params.leafSugarPerReaction / efficiency;
                const waterToConvert = Math.min(tissue.inventory.water, bestEfficiencyWater);
                const chance = speed * params.leafReactionRate * waterToConvert / bestEfficiencyWater;
                if (Math.random() < chance) {
                    this.didConvert = true;
                    const sugarConverted = waterToConvert * efficiency;
                    tissue.inventory.add(-waterToConvert, sugarConverted);
                    this.sugarConverted += sugarConverted;
                }

            }
        }
        if (numAir > 0) {
            this.averageEfficiency /= numAir;
            // this.averageSpeed /= numAir;
        }
    }
}

export class Root extends Cell {
    static displayName = "Root";
    public waterTransferAmount = 0;
    // public tilePairs: Vector2[] = []; // implied that the opposite direction is connected
    public activeNeighbors: Vector2[] = [];
    public inventory: Inventory = new Inventory(20);
    cooldown = 0;

    public step() {
        super.step();
        if (this.cooldown <= 0) {
            this.stepWaterTransfer();
            this.cooldown += params.rootTurnsPerTransfer;
        }
        this.cooldown -= 1;
    }

    private stepWaterTransfer() {
        this.waterTransferAmount = 0;
        // this.tilePairs = [];
        this.activeNeighbors = [];
        const neighbors = this.world.tileNeighbors(this.pos);
        for (const [dir, tile] of neighbors.entries()) {
            // const oppositeTile = this.world.tileAt(this.pos.x - dir.x, this.pos.y - dir.y);
            if (tile instanceof Soil
                /* && oppositeTile instanceof Tissue*/) {
                // this.tilePairs.push(dir);
                // const transferAmount = Math.ceil(Math.max(0, soilWater - tissueWater) / 2);
                // if (tile.inventory.water > 0) {
                //     const {water: transferAmount} = tile.inventory.give(oppositeTile.inventory, 1, 0);
                //     if (transferAmount > 0) {
                //         this.waterTransferAmount += transferAmount;
                //         // add a random to trigger the !== on water transfer audio
                //         this.waterTransferAmount += Math.random() * 0.0001;
                //     }
                // }
                this.activeNeighbors.push(dir);
                const {water} = tile.inventory.give(this.inventory, 1, 0);
                this.waterTransferAmount += water + Math.random() * 0.0001;
            }
        }
    }
}

export class Fruit extends Cell {
    static displayName = "Fruit";
    public inventory = new Inventory(1100);

    // seeds aggressively take the inventory from neighbors
    step() {
        super.step();
        const neighbors = this.world.tileNeighbors(this.pos);
        for (const [dir, neighbor] of neighbors) {
            if (hasInventory(neighbor)) {
                // LMAO
                neighbor.inventory.give(this.inventory, 0, neighbor.inventory.sugar);
            }
        }
    }
}

export class Transport extends Tissue {
    static displayName = "Transport";
    public dir!: Vector2;
    public cooldown = 0;

    step() {
        // transport hungers at double speed
        this.energy -= 1;
        super.step();
        const targetTile = this.world.tileAt(this.pos.x + this.dir.x, this.pos.y + this.dir.y);
        if (targetTile instanceof Cell && hasInventory(targetTile) && this.cooldown <= 0) {
            this.inventory.give(targetTile.inventory, 1, 1);
            this.cooldown += params.transportTurnsPerMove;
        }
        this.cooldown -= 1;
    }
}

export class Vein extends Tissue {
    static displayName = "Vein";
    static diffusionWater = 0.8;
    static diffusionSugar = 0.8;
}

function isSubclass<T, U>(a: T, b: U) {
    return a instanceof b.constructor || b instanceof a.constructor;
}
