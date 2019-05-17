import { Vector2 } from "three";
import devlog from "../../../common/devlog";
import { Noise } from "../../../common/perlin";
import { map } from "../../../math/index";
import { DIRECTION_VALUES } from "../directions";
import { Entity, GameState, height, isSteppable, width } from "../index";
import { hasInventory } from "../inventory";
import { params } from "../params";
import { Player } from "./player";
import { Air, Cell, DeadCell, Fountain, Fruit, hasEnergy, Rock, Soil, Tile, Tissue } from "./tile";

export class World {
    public time: number = 0;
    public readonly player = new Player(new Vector2(width / 2, height / 2), this);
    public fruit?: Fruit = undefined;
    private gridEnvironment: Tile[][] = (() => {
        // start with a half water half air
        const noiseWater = new Noise();
        const noiseRock = new Noise();
        const noiseHeight = new Noise();
        const grid = new Array(width).fill(undefined).map((_, x) => (new Array(height).fill(undefined).map((__, y) => {
            const pos = new Vector2(x, y);
            const soilLevel = height / 2
                - 4 * (noiseHeight.perlin2(0, x / 5) + 1) / 2
                - 16 * (noiseHeight.perlin2(10, x / 20 + 10));
            if (y > soilLevel) {
                // const water = Math.floor(20 + Math.random() * 20);
                const rockThreshold = map(y - height / 2, 0, height / 2, -0.7, 0.3);
                const isRock = noiseRock.simplex2(x / 5, y / 5) < rockThreshold;
                if (isRock) {
                    const rock = new Rock(pos, this);
                    return rock;
                } else {
                    const heightScalar = Math.pow(map(y - height / 2, 0, height / 2, 0.5, 1), 2);
                    const simplexScalar = 0.2;
                    // this 0.1 factor makes a *huge* difference
                    const simplexValue = noiseWater.simplex2(x * simplexScalar, y * simplexScalar) + 0.2;
                    const water = Math.round(Math.max(1, Math.min(
                        // should be soil_max_water, isn't cuz of dependency cycles messing up instantiation
                        20, simplexValue > 0.4 ? 20 * heightScalar : 0)));
                    if (heightScalar > 0.6 && simplexValue > 1) {
                        return new Fountain(pos, water, this);
                    } else {
                        return new Soil(pos, water, this);
                    }
                }
            } else {
                const air = new Air(pos, this);
                return air;
            }
        })));
        return grid;
    })();
    private gridCells: Array<Array<Cell | null>> = (() => {
        const radius = 2.5;
        const grid = new Array(width).fill(undefined).map((_, x) => (new Array(height).fill(undefined).map((__, y) => {
            const pos = new Vector2(x, y);
            // add a "seed" of tissue around the player
            if (this.player.pos.distanceTo(pos) < radius) {
                return new Tissue(pos, this);
            } else {
                return null;
            }
        })));
        return grid;
    })();
    constructor() {
        this.fillCachedEntities();
    }
    public tileAt(x: number, y: number): Tile | null {
        if (!this.isValidPosition(x, y)) {
            return null;
        }
        const cell = this.gridCells[x][y];
        if (cell != null) {
            return cell;
        } else {
            return this.gridEnvironment[x][y];
        }
    }
    public cellAt(x: number, y: number): Cell | null {
        if (this.isValidPosition(x, y)) {
            return this.gridCells[x][y];
        } else {
            return null;
        }
    }
    // Rules for replacement:
    // if tile is environment, clear out the gridCell and set the gridEnvironment.
    // if tile is cell, set gridCell, leave gridEnvironment alone.
    public setTileAt(position: Vector2, tile: Tile): any {
        const { x, y } = position;
        if (!this.isValidPosition(x, y)) {
            throw new Error(`invalid position ${x}, ${y} `);
        }
        const oldTile = this.tileAt(x, y)!;
        // if replacing a tile with inventory, try giving resources to neighbors of the same type
        if (hasInventory(oldTile)) {
            // one mechanic - push water to nearby tiles
            // const neighbors = this.tileNeighbors(position);
            // for (const neighbor of neighbors.values()) {
            //     if (hasInventory(neighbor) && neighbor instanceof oldTile.constructor) {
            //         oldTile.inventory.give(neighbor.inventory, oldTile.inventory.water, oldTile.inventory.sugar);
            //     }
            //     if (oldTile.inventory.water === 0 && oldTile.inventory.sugar === 0) {
            //         // we're all done
            //         break;
            //     }
            // }
            if (hasInventory(tile)) {
                oldTile.inventory.give(tile.inventory, oldTile.inventory.water, oldTile.inventory.sugar);
            }
            if (oldTile.inventory.water !== 0 || oldTile.inventory.sugar !== 0) {
                console.warn("lost", oldTile.inventory, "resources to building");
                oldTile.inventory.change(-oldTile.inventory.water, -oldTile.inventory.sugar);
            }
        }
        // there's a chance we straight up lose some water as it overfills capacity
        if (tile instanceof Cell) {
            // set gridCell only
            this.gridCells[x][y] = tile;
        } else {
            // hackhack - we should call .die() on gridCells[x][y] but we already have with the oldTile code above
            this.gridCells[x][y] = null;
            this.gridEnvironment[x][y] = tile;
        }
        this.fillCachedEntities();
    }
    public maybeRemoveCellAt(position: Vector2): Cell | null {
        const maybeCell = this.cellAt(position.x, position.y);
        if (maybeCell) {
            this.gridCells[position.x][position.y] = null;
        }
        this.fillCachedEntities();
        return maybeCell;
    }
    public isValidPosition(x: number, y: number) {
        if (x >= width || x < 0 || y >= height || y < 0) {
            return false;
        } else {
            return true;
        }
    }
    public tileNeighbors(pos: Vector2) {
        const mapping = new Map<Vector2, Tile>();
        // randomize the neighbor array to reduce aliasing
        const directions = DIRECTION_VALUES_RAND[this.time % DIRECTION_VALUES_RAND.length];
        directions.forEach((v) => {
            const x = pos.x + v.x;
            const y = pos.y + v.y;
            const tile = this.tileAt(x, y);
            if (tile != null) {
                mapping.set(v, tile);
            }
        });
        return mapping;
    }
    // only use for rendering
    private cachedRenderableEntities?: Entity[];
    public renderableEntities() {
        if (this.cachedRenderableEntities == null) {
            throw new Error("accessed renderable entities before filling");
        }
        return this.cachedRenderableEntities;
    }
    private cachedEntities?: Entity[];
    public entities() {
        if (this.cachedEntities == null) {
            throw new Error("accessed entities before filling");
        }
        return this.cachedEntities;
    }
    private fillCachedEntities() {
        const newEntities: Entity[] = [];
        // we do this super hacky thing for performance where we only run every other entity in
        // a checkerboard pattern.
        //
        // also, entities can interact with other entities, there is no lock-step buffer state,
        // which means you can get weird artifacts like "water suddenly moves 20 squares".
        // to combat this we alternatingly reverse the tile iteration order.
        let x = 0, y = 0;
        for (x = 0; x < width; x++) {
            for (y = (x + this.time) % 2; y < height; y += 2) {
                // checkerboard
                newEntities.push(this.tileAt(x, y)!);
            }
        }
        for (x = 0; x < width; x++) {
            for (y = (x + this.time + 1) % 2; y < height; y += 2) {
                // opposite checkerboard
                newEntities.push(this.tileAt(x, y)!);
            }
        }
        if (this.time % 4 < 2) {
            newEntities.reverse();
        }
        // add player at the end - this is important since Player is currently the only thing
        // that modifies tiles. You can get into situations where tiles that should be dead
        // are still left-over in the entities cache.
        newEntities.push(this.player);
        this.cachedEntities = newEntities;
        (() => {
            const entities: Entity[] = [this.player];
            for (x = 0; x < width; x++) {
                for (y = 0; y < height; y++) {
                    entities.push(this.gridEnvironment[x][y]);
                    const cellMaybe = this.gridCells[x][y];
                    if (cellMaybe != null) {
                        entities.push(cellMaybe);
                    }
                }
            }
            this.cachedRenderableEntities = entities;
        })();
    }
    // iterate through all the actions
    public step() {
        const entities = this.entities();
        // dear god
        entities.forEach((entity) => {
            if (isSteppable(entity)) {
                entity.step();
            }
        });
        this.computeSunlight();
        this.time++;
        this.fillCachedEntities();
        // this.checkResources();
    }
    public computeSunlight() {
        // sunlight is special - we step downards from the top; neighbors don't affect the calculation so we don't have buffering problems
        const directionalBias = Math.cos(this.time * Math.PI * 2 / 2000);
        for (let y = 0; y <= height * 0.6; y++) {
            for (let x = 0; x < width; x++) {
                const t = this.tileAt(x, y);
                if (t instanceof Air) {
                    let sunlight = 0;
                    if (y === 0) {
                        sunlight = 1;
                    } else {
                        const tileUp = this.tileAt(x, y - 1);
                        const tileRight = this.tileAt(x + 1, y - 1);
                        const tileLeft = this.tileAt(x - 1, y - 1);
                        const upSunlight = tileUp instanceof Air ? tileUp.sunlightCached : tileUp == null ? 1 : 0;
                        const rightSunlight = tileRight instanceof Air ? tileRight.sunlightCached : tileRight == null ? 1 : 0;
                        const leftSunlight = tileLeft instanceof Air ? tileLeft.sunlightCached : tileLeft == null ? 1 : 0;
                        if (directionalBias > 0) {
                            // positive light travels to the right
                            sunlight = rightSunlight * directionalBias + upSunlight * (1 - directionalBias);
                        } else {
                            sunlight = leftSunlight * -directionalBias + upSunlight * (1 - (-directionalBias));
                        }
                        // sunlight = upSunlight * 0.5 + rightSunlight * 0.25 + leftSunlight * 0.25;
                        sunlight = sunlight * 0.5 + ((upSunlight + rightSunlight + leftSunlight) / 3) * 0.5;
                    }
                    // have at least a bit
                    sunlight = params.sunlightReintroduction + sunlight * (1 - params.sunlightReintroduction);
                    t.sunlightCached = sunlight;
                }
            }
        }
    }
    // public computeStress() {
    //     // each cell looks at their neighboring 8 cells and tries to give their stress to the neighbor
    //     // if the neighbor is soil or rock, it's 100% free
    // }
    public checkWinLoss(): GameState | null {
        // you win if there's a seed with full capacity
        if (this.fruit != null) {
            if (this.fruit.inventory.sugar > 1000) {
                return "win";
            }
        }
        // you lose if you're standing on a dead cell
        if (this.tileAt(this.player.pos.x, this.player.pos.y) instanceof DeadCell) {
            return "lose";
        }
        return null;
    }
    public checkResources() {
        let totalSugar = 0;
        let totalWater = 0;
        let totalEnergy = 0;
        this.entities().forEach((e) => {
            if (hasInventory(e)) {
                totalSugar += e.inventory.sugar;
                totalWater += e.inventory.water;
            }
            if (hasEnergy(e)) {
                totalEnergy += e.energy;
            }
        });
        devlog("sugar", totalSugar, "water", totalWater, "energy", totalEnergy);
    }
}

function shuffle<T>(array: T[]) {
    let currentIndex = array.length, temporaryValue, randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}
const DIRECTION_VALUES_RAND = [
    shuffle(DIRECTION_VALUES.slice()),
    shuffle(DIRECTION_VALUES.slice()),
    shuffle(DIRECTION_VALUES.slice()),
    shuffle(DIRECTION_VALUES.slice()),
    shuffle(DIRECTION_VALUES.slice()),
];