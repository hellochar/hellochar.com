import * as $ from "jquery";
import * as React from "react";
import * as THREE from "three";
import { Color, Geometry, Material, Mesh, MeshBasicMaterial, Object3D, OrthographicCamera, PlaneBufferGeometry, Scene, Vector2, Vector3 } from "three";

import { BufferAttribute } from "three";
import { BufferGeometry } from "three";
import { Float32BufferAttribute } from "three";
import { LineBasicMaterial } from "three";
import { Line } from "three";
import devlog from "../../common/devlog";
import lazy from "../../common/lazy";
import { Noise } from "../../common/perlin";
import { lerp, map } from "../../math/index";
import { ISketch, SketchAudioContext } from "../../sketch";
import { Action, ActionBuild, ActionBuildTransport, ActionDrop, ActionMove, ActionStill } from "./action";
import { blopBuffer, build, drums, footsteps, hookUpAudio, strings, suckWaterBuffer } from "./audio";
import { hasInventory, Inventory } from "./inventory";
import { fruitTexture, textureFromSpritesheet } from "./spritesheet";
import { Air, Cell, CELL_ENERGY_MAX, CELL_SUGAR_BUILD_COST, DeadCell, Fountain, Fruit, hasEnergy, hasTilePairs, Leaf, Rock, Root, Soil, Tile, Tissue, Transport } from "./tile";
import { GameStack, HUD, TileHover } from "./ui";

export type Entity = Tile | Player;

interface Steppable {
    step(): void;
}

function isSteppable(obj: any): obj is Steppable {
    return typeof obj.step === "function";
}

export interface Constructor<T> {
    new(...args: any[]): T;
    // lmao
    displayName: string;
}

export const PLAYER_MAX_INVENTORY = 100;
class Player {
    public inventory = new Inventory(PLAYER_MAX_INVENTORY, 50, 50);
    public action?: Action;
    public constructor(public pos: Vector2, public world: World) {}

    public droopY() {
        const tile = this.world.tileAt(this.pos.x, this.pos.y);
        if (tile instanceof Cell) {
            return tile.droopY;
        } else {
            return 0;
        }
    }

    public droopPos() {
        const droopY = this.droopY();
        if (droopY !== 0) {
            const t = this.pos.clone();
            t.y += droopY;
            return t;
        }
        return this.pos;
    }

    public step() {
        if (this.action === undefined) {
            throw new Error("tried stepping player before action was filled in!");
        }
        this.attemptAction(this.action);
        this.action = undefined;
        const tile = this.world.tileAt(this.pos.x, this.pos.y);
        if (tile instanceof Transport) {
            const action: ActionMove = {
                type: "move",
                dir: tile.dir,
            };
            this.attemptAction(action);
        }
    }

    public attemptAction(action: Action) {
        switch (action.type) {
            case "still":
                this.attemptStill(action);
                break;
            case "move":
                this.attemptMove(action);
                break;
            case "build":
                this.attemptBuild(action);
                break;
            case "build-transport":
                this.attemptBuildTransport(action);
                break;
            case "drop":
                this.attemptDrop(action);
                break;
        }
    }

    public verifyMove(action: ActionMove) {
        const target = this.pos.clone().add(action.dir);
        if (!this.world.isValidPosition(target.x, target.y)) {
            return false;
        }
        const targetTile = this.world.tileAt(target.x, target.y);
        if (!(targetTile instanceof Tissue)) {
            // can't move!
            return false;
        }
        return true;
    }

    public attemptMove(action: ActionMove) {
        if (this.verifyMove(action)) {
            footsteps.audio.currentTime = Math.random() * 0.05;
            footsteps.gain.gain.cancelScheduledValues(0);
            footsteps.gain.gain.value = 0.2;
            footsteps.gain.gain.linearRampToValueAtTime(0, footsteps.gain.context.currentTime + 0.05);
            // do the move
            this.pos.add(action.dir);
            this.autopickup();
        }
    }

    public attemptStill(action: ActionStill) {
        this.autopickup();
    }

    private autopickup() {
        // autopickup resources in the position as possible
        const targetTile = this.world.tileAt(this.pos.x, this.pos.y);
        if (hasInventory(targetTile)) {
            const inv = targetTile.inventory;
            inv.give(this.inventory, inv.water, inv.sugar);
        }
    }

    public tryConstructingNewCell<T>(position: Vector2, cellType: Constructor<T>) {
        const targetTile = this.world.tileAt(position.x, position.y);
        if (targetTile == null) {
            // out of bounds/out of map
            return;
        }

        // disallow building a seed if there already is one
        // todo fix typings on constructor vs typeof
        if (this.world.fruit != null && (cellType as any) === Fruit) {
            return;
        }

        // disallow building over a seed
        if (targetTile instanceof Fruit) {
            return;
        }

        const waterCost = 1;
        const sugarCost = CELL_SUGAR_BUILD_COST;
        if (!(targetTile instanceof cellType) &&
            !(targetTile instanceof Rock) &&
            this.inventory.water >= waterCost &&
            this.inventory.sugar >= sugarCost) {
            this.inventory.change(-waterCost, -sugarCost);
            const newTile = new cellType(position, this.world);

            build.audio.currentTime = 0;
            build.gain.gain.cancelScheduledValues(0);
            build.gain.gain.value = 0.2;
            build.gain.gain.exponentialRampToValueAtTime(0.0001, build.gain.context.currentTime + 0.50);
            return newTile;
        } else {
            return undefined;
        }
    }

    public attemptBuild(action: ActionBuild) {
        const newCell = this.tryConstructingNewCell(action.position, action.cellType);
        if (newCell != null) {
            newCell.droopY = this.droopY();
            this.world.setTileAt(action.position, newCell);
            if (this.world.fruit == null && newCell instanceof Fruit) {
                this.world.fruit = newCell;
            }
        }
    }

    public attemptBuildTransport(action: ActionBuildTransport) {
        const newCell = this.tryConstructingNewCell(action.position, action.cellType);
        if (newCell != null) {
            newCell.dir = action.dir;
            this.world.setTileAt(action.position, newCell);
        }
    }

    public attemptDrop(action: ActionDrop) {
        // drop as much as you can onto the current tile
        const currentTile = this.world.tileAt(this.pos.x, this.pos.y);
        if (hasInventory(currentTile)) {
            const { water, sugar } = action;
            this.inventory.give(currentTile.inventory, water, sugar);
        }
    }
}

export const width = 50;
export const height = 100;
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
const DIRECTION_VALUES_RAND = [
    shuffle(DIRECTION_VALUES.slice()),
    shuffle(DIRECTION_VALUES.slice()),
    shuffle(DIRECTION_VALUES.slice()),
    shuffle(DIRECTION_VALUES.slice()),
    shuffle(DIRECTION_VALUES.slice()),
];

// https://stackoverflow.com/a/37580979
function permute<T>(permutation: T[]) {
  const length = permutation.length,
      result = [permutation.slice()],
      c = new Array(length).fill(0);
  let i = 1, k, p;

  while (i < length) {
    if (c[i] < i) {
      k = i % 2 && c[i];
      p = permutation[i];
      permutation[i] = permutation[k];
      permutation[k] = p;
      ++c[i];
      i = 1;
      result.push(permutation.slice());
    } else {
      c[i] = 0;
      ++i;
    }
  }
  return result;
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

export class World {
    public time: number = 0;
    public player: Player = new Player(new Vector2(width / 2, height / 2), this);
    public fruit?: Fruit = undefined;
    private gridEnvironment: Tile[][] = (() => {
        // start with a half water half air
        const noiseWater = new Noise();
        const noiseRock = new Noise();
        const noiseHeight = new Noise();
        const grid = new Array(width).fill(undefined).map((_, x) => (
            new Array(height).fill(undefined).map((__, y) => {
                const pos = new Vector2(x, y);
                const soilLevel =
                    height / 2
                    - 4 * (noiseHeight.perlin2(0, x / 5) + 1) / 2
                    - 16 * (noiseHeight.perlin2(10, x / 20 + 10))
                    ;
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
                        const water =
                            Math.round(
                                Math.max(
                                    1,
                                    Math.min(
                                        // should be soil_max_water, isn't cuz of dependency cycles messing up instantiation
                                        20,
                                        simplexValue > 0.4 ? 20 * heightScalar : 0, // Math.sqrt() * 100 * heightScalar;
                                    )));
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
            })
        ));

        return grid;
    })();

    private gridCells: Array<Array<Cell | null>> = (() => {
        const radius = 2.5;
        const grid = new Array(width).fill(undefined).map((_, x) => (
            new Array(height).fill(undefined).map((__, y) => {
                const pos = new Vector2(x, y);
                // add a "seed" of tissue around the player
                if (this.player.pos.distanceTo(pos) < radius) {
                    return new Tissue(pos, this);
                } else {
                    return null;
                }
            })
        ));
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

    // Rules for replacement:
    // if tile is environment, clear out the gridCell and set the gridEnvironment.
    // if tile is cell, set gridCell, leave gridEnvironment alone.
    public setTileAt(position: Vector2, tile: Tile): any {
        const {x, y} = position;
        if (!this.isValidPosition(x, y)) {
            throw new Error(`invalid position ${x}, ${y} `);
        }
        const oldTile = this.tileAt(x, y)!;
        // if replacing a tile with inventory, try giving resources to neighbors of the same type
        if (hasInventory(oldTile)) {
            const neighbors = this.tileNeighbors(position);
            for (const neighbor of neighbors.values()) {
                if (hasInventory(neighbor) && neighbor instanceof oldTile.constructor) {
                    oldTile.inventory.give(neighbor.inventory, oldTile.inventory.water, oldTile.inventory.sugar);
                }
                if (oldTile.inventory.water === 0 && oldTile.inventory.sugar === 0) {
                    // we're all done
                    break;
                }
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
        // dear god
        const flattenedTiles: Tile[] = [];
        let x = 0, y = 0;
        for (x = 0; x < width; x++) {
            for (y = (x + this.time) % 2; y < height; y += 2) {
                // checkerboard
                flattenedTiles.push(this.tileAt(x, y)!);
            }
        }
        for (x = 0; x < width; x++) {
            for (y = (x + this.time + 1) % 2; y < height; y += 2) {
                // opposite checkerboard
                flattenedTiles.push(this.tileAt(x, y)!);
            }
        }
        if (this.time % 4 < 2) {
            flattenedTiles.reverse();
        }
        // switch (this.time % 4) {
        //     case 0:
        //         // start at top-left corner, go down/right
        //         flattenedTiles = ([] as Tile[]).concat(...this.grid);
        //         break;
        //     case 1:
        //         // start at top-right corner, go down/left
        //         flattenedTiles = ([] as Tile[]).concat(...this.grid.slice().reverse());
        //         break;
        //     case 2:
        //         // start at bottom-left corner, go up/right
        //         flattenedTiles = ([] as Tile[]).concat(...this.grid.map((col) => col.slice().reverse()));
        //         break;
        //     case 3:
        //         // start at bottom-right corner, go up/left
        //         flattenedTiles = ([] as Tile[]).concat(...this.grid.slice().reverse().map((col) => col.slice().reverse()));
        //         break;
        // }
        const newEntities = ([this.player] as Entity[]).concat(flattenedTiles);
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
        this.checkResources();
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
                    sunlight = 0.2 + sunlight * 0.8;
                    t.sunlightCached = sunlight;
                }
            }
        }
    }

    // public computeStress() {
    //     // each cell looks at their neighboring 8 cells and tries to give their stress to the neighbor
    //     // if the neighbor is soil or rock, it's 100% free
    // }

    public checkWinLoss(): GameState {
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
        return "main";
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

function lerp2(v: Vector3, t: {x: number, y: number}, l: number) {
    v.x = v.x * (1 - l) + t.x * l;
    v.y = v.y * (1 - l) + t.y * l;
}

abstract class Renderer<T> {
    constructor(public target: T, public scene: Scene, public mito: Mito) { }

    abstract update(): void;

    abstract destroy(): void;
}

class PlayerRenderer extends Renderer<Player> {
    public mesh: Mesh;
    constructor(target: Player, scene: Scene, mito: Mito) {
        super(target, scene, mito);
        this.mesh = new Mesh(
            new PlaneBufferGeometry(1, 1),
            // new THREE.CircleBufferGeometry(0.5, 20),
            new MeshBasicMaterial({
                transparent: true,
                depthWrite: false,
                depthTest: false,
                map: textureFromSpritesheet(29, 12, "transparent"),
                color: new Color("white"),
                side: THREE.DoubleSide,
            }),
        );
        devlog("created player renderer");
        lerp2(this.mesh.position, this.target.pos, 1);
        this.mesh.position.z = 2;
        this.scene.add(this.mesh);
    }

    update() {
        lerp2(this.mesh.position, this.target.droopPos(), 0.5);
        this.mesh.position.z = 2;
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}

const materialMapping = lazy(() => {
    const materials = new Map<Constructor<Tile>, Material>();
    materials.set(Air, new MeshBasicMaterial({
        side: THREE.DoubleSide,
        depthWrite: false,
        // color: new Color("rgb(209, 243, 255)"),
    }));
    materials.set(Soil, new MeshBasicMaterial({
        map: textureFromSpritesheet(8, 11),
        // map: textureFromSpritesheet(41, 26),
        // map: textureFromSpritesheet(679 / 16, 438 / 16),
        side: THREE.DoubleSide,
        // color: new Color(0xcccccc),
        color: new Color("rgb(112, 89, 44)"),
        depthWrite: false,
    }));
    materials.set(Fountain, new MeshBasicMaterial({
        map: textureFromSpritesheet(56 / 16, 38 / 16),
        side: THREE.DoubleSide,
    }));
    materials.set(Rock, new MeshBasicMaterial({
        map: textureFromSpritesheet(26, 20),
        side: THREE.DoubleSide,
        color: new Color("rgb(63, 77, 84)"),
    }));
    materials.set(DeadCell, new MeshBasicMaterial({
        map: textureFromSpritesheet(137 / 16, 374 / 16),
        side: THREE.DoubleSide,
        color: new Color("rgb(128, 128, 128)"),
    }));
    materials.set(Tissue, new MeshBasicMaterial({
        map: textureFromSpritesheet(6, 31),
        side: THREE.DoubleSide,
        color: new Color(0x30ae25),
    }));
    materials.set(Transport, materials.get(Tissue)!);
    // materialMapping.set(Transport, new MeshBasicMaterial({
    //     map: arrowUpMaterial(),
    //     side: THREE.DoubleSide,
    //     color: new THREE.Color("rgb(42, 138, 25)"),
    // }));
    materials.set(Leaf, new MeshBasicMaterial({
        // map: textureFromSpritesheet(9, 31),
        map: textureFromSpritesheet(55 / 16, 280 / 16),
        // map: textureFromSpritesheet(16, 10),
        side: THREE.DoubleSide,
        // color: new Color("rgb(9, 112, 0)"),
    }));
    materials.set(Root, new MeshBasicMaterial({
        // map: textureFromSpritesheet(0, 31),
        map: textureFromSpritesheet(59 / 16, 327 / 16),
        side: THREE.DoubleSide,
        // color: new Color("lightgreen"),
    }));
    materials.set(Fruit, new MeshBasicMaterial({
        map: fruitTexture,
        side: THREE.DoubleSide,
        transparent: true,
    }));
    return materials;
});

function getMaterial(tile: Tile) {
    // careful - creates a new instance per tile
    return materialMapping().get(tile.constructor as Constructor<Tile>)!.clone();
}

// const AIR_COLORSCALE = [
//     new Color("rgb(91, 117, 154)"),
//     new Color("rgb(158, 179, 196)"),
//     new Color("hsv(35, 7%, 99%)"),
// ];

// const AIR_COLORSCALE = [
//     new Color("hsl(14, 81%, 52%)"),
//     new Color("hsl(34, 61%, 72%)"),
//     new Color("hsl(61, 54%, 87%)"),
//     new Color("hsl(67, 35%, 99%)"),
//     new Color("hsl(213, 63%, 52%)"),
//     // new Color("hsl(37, 35%, 99%)"),
// ];

// const AIR_COLORSCALE = [
//     new Color("hsl(34, 61%, 56%)"),
//     new Color("hsl(67, 31%, 55%)"),
//     new Color("hsl(213, 63%, 58%)"),
//     // new Color("hsl(37, 35%, 99%)"),
// ];

const AIR_COLORSCALE = [
    new Color("hsl(67, 31%, 55%)"),
    new Color("hsl(180, 31%, 76%)"),
    new Color("hsl(213, 63%, 58%)"),
    // new Color("hsl(37, 35%, 99%)"),
];

// const AIR_COLORSCALE = [
//     new Color("rgb(146, 215, 255)"),
//     new Color("rgb(53, 125, 210)"),
//     new Color("rgb(56, 117, 154)"),
// ];

class TileRenderer extends Renderer<Tile> {
    public object = new Object3D();
    public mesh: Mesh;
    static geometry = new PlaneBufferGeometry(1, 1);
    private inventoryRenderer?: InventoryRenderer;
    private originalColor: THREE.Color;
    private audio?: THREE.Audio;
    private lastAudioValueTracker = 0;
    private pairsLines: THREE.Line[] = [];

    constructor(target: Tile, scene: Scene, mito: Mito) {
        super(target, scene, mito);
        const mat = getMaterial(this.target) as MeshBasicMaterial;
        const geom = TileRenderer.geometry;
        this.mesh = new Mesh(
            geom,
            mat,
        );
        if (this.target instanceof Air) {
            const colorIndex = map(this.target.co2(), 0.40, 1.001, 0, AIR_COLORSCALE.length - 1);
            const startColorIndex = Math.floor(colorIndex);
            const startColor = AIR_COLORSCALE[startColorIndex];
            this.originalColor = startColor.clone();
            if (startColorIndex !== AIR_COLORSCALE.length - 1) {
                const alpha = colorIndex - startColorIndex;
                const endColorIndex = startColorIndex + 1;
                const endColor = AIR_COLORSCALE[endColorIndex];
                this.originalColor.lerp(endColor, alpha);
            }
        } else {
            this.originalColor = mat.color.clone();
        }
        this.object.add(this.mesh);

        if (hasInventory(this.target)) {
            this.inventoryRenderer = new InventoryRenderer(this.target.inventory, this.scene, this.mito);
            this.inventoryRenderer.animationOffset = (this.target.pos.x + this.target.pos.y) / 2;
            this.object.add(this.inventoryRenderer.object);
        }
        this.scene.add(this.object);

        const zIndex = this.target instanceof Cell ? 1 : 0;
        this.object.position.set(this.target.pos.x, this.target.pos.y, zIndex);

        if (this.target instanceof Cell) {
            this.object.scale.set(0.01, 0.01, 1);
        } else {
            this.object.matrixAutoUpdate = false;
            this.mesh.matrixAutoUpdate = false;
        }
        this.object.updateMatrix();
        this.mesh.updateMatrix();

        if (this.target instanceof Transport) {
            const dir = new Vector3(this.target.dir.x, this.target.dir.y, 0).normalize();
            const length = 0.3;
            const start = new Vector3(dir.x * -length / 2, dir.y * -length / 2, 0.1);
            const arrow = new THREE.ArrowHelper(
                dir,
                start,
                length,
                0xffffff,
                0.1,
                0.1);
            this.object.add(arrow);
        }

        if (this.target instanceof Leaf || this.target instanceof Root) {
            this.audio = new THREE.Audio(this.mito.audioListener);
            this.object.add(this.audio);
        }
    }

    update() {
        lerp2(this.object.scale, new THREE.Vector2(1, 1), 0.1);
        const lightAmount = this.target.lightAmount();
        const mat = this.mesh.material as MeshBasicMaterial;
        if (this.target instanceof Air) {
            const colorIndex = map(this.target.co2(), 0.40, 1.001, 0, AIR_COLORSCALE.length - 1);
            const startColorIndex = Math.floor(colorIndex);
            const startColor = AIR_COLORSCALE[startColorIndex];
            this.originalColor = startColor.clone();
            if (startColorIndex !== AIR_COLORSCALE.length - 1) {
                const alpha = colorIndex - startColorIndex;
                const endColorIndex = startColorIndex + 1;
                const endColor = AIR_COLORSCALE[endColorIndex];
                this.originalColor.lerp(endColor, alpha);
            }
        }
        mat.color = new THREE.Color(0).lerp(this.originalColor, lightAmount);
        if (this.target instanceof Cell) {
            this.object.position.set(this.target.pos.x, this.target.pos.y + this.target.droopY, 1);
        }
        if (hasEnergy(this.target)) {
            mat.color.lerp(new THREE.Color(0), 1 - this.target.energy / CELL_ENERGY_MAX);
        }
        if (this.inventoryRenderer != null) {
            if (lightAmount === 0) {
                this.inventoryRenderer.object.visible = false;
            } else {
                this.inventoryRenderer.update();
                this.inventoryRenderer.object.visible = true;
            }
        }
        if (this.target instanceof Leaf && this.audio != null) {
            const newAudioValueTracker = this.target.didConvert ? 1 : 0;
            if (newAudioValueTracker !== this.lastAudioValueTracker && newAudioValueTracker > 0) {
                this.audio.setBuffer(blopBuffer);
                const dist = this.target.pos.distanceToSquared(this.mito.world.player.pos);
                const volume = Math.min(1, 1 / (1 + dist / 25));
                this.audio.setVolume(volume);
                // this.audio.setRefDistance(2);
                // play blop sound
                this.audio.play();
            }
            this.lastAudioValueTracker = newAudioValueTracker;
            // this.audio.setBuffer(blopBuffer);
            // this.audio.setRefDistance(2);
            // play blop sound
            // this.audio.play();
        }

        if (this.target instanceof Root && this.audio != null) {
            const newAudioValueTracker = this.target.waterTransferAmount;
            if (newAudioValueTracker !== this.lastAudioValueTracker) {
                this.audio.setBuffer(suckWaterBuffer);
                const baseVolume = this.target.waterTransferAmount / (2 + this.target.waterTransferAmount);
                const dist = this.target.pos.distanceToSquared(this.mito.world.player.pos);
                const volume = Math.min(1, 1 / (1 + dist / 25)) * baseVolume;
                this.audio.setVolume(volume);
                if (this.audio.source != null) {
                    this.audio.stop();
                }
                this.audio.play();
            }
            this.lastAudioValueTracker = newAudioValueTracker;
        }

        if (hasTilePairs(this.target)) {
            const pairColor = this.target instanceof Leaf ? 0xffc90e : InventoryRenderer.waterMaterial.color.getHex();
            const pairs = this.target.tilePairs;
            if (pairs.length !== this.pairsLines.length) {
                // redo pairs
                this.pairsLines.forEach((line) => this.object.remove(line));
                this.pairsLines = pairs.map((dir) => {
                    const length = dir.length() * 2 - 0.25;
                    const arrowDir = new THREE.Vector3(dir.x, dir.y, 0).normalize();
                    const arrowHelper = this.makeLine(arrowDir, arrowDir.clone().multiplyScalar(-length / 2), length, pairColor);
                    arrowHelper.position.z = 0.1;
                    this.object.add(arrowHelper);
                    return arrowHelper;
                });
            }
        }
    }

    static lineGeometry = (() => {
        const g = new BufferGeometry();
        g.addAttribute('position', new Float32BufferAttribute([0, 0, 0, 0, 1, 0], 3));
        return g;
    })();

    private makeLine(dir: Vector3, origin: Vector3, length: number, color: number) {
        // copied from https://github.com/mrdoob/three.js/blob/master/src/helpers/ArrowHelper.js
        const line = new Line(TileRenderer.lineGeometry, new LineBasicMaterial({ color: color }));
        line.position.copy(origin);

        // dir is assumed to be normalized
        if (dir.y > 0.99999) {
            line.quaternion.set(0, 0, 0, 1);
        } else if (dir.y < - 0.99999) {
            line.quaternion.set(1, 0, 0, 0);
        } else {
            const axis = new Vector3(dir.z, 0, - dir.x).normalize();
            const radians = Math.acos(dir.y);
            line.quaternion.setFromAxisAngle(axis, radians);
        }
        line.scale.set(1, Math.max(0, length), 1);
        line.updateMatrix();
        line.matrixAutoUpdate = false;
        return line;
    }

    destroy() {
        this.scene.remove(this.object);
        if (this.inventoryRenderer != null) {
            this.inventoryRenderer.destroy();
        }
    }
}

// we represent Resources as dots of certain colors.
class InventoryRenderer extends Renderer<Inventory> {
    static geometry = new PlaneBufferGeometry(1, 1);
    static waterMaterial = new MeshBasicMaterial({
        // map: textureFromSpritesheet(0, 1),
        transparent: true,
        opacity: 0.75,
        // color: new Color("rgb(12, 41, 255)"),
        // color: new Color("rgb(29, 42, 255)"),
        color: new Color("rgb(9, 12, 255)"),
        side: THREE.DoubleSide,
    });
    static sugarMaterial = lazy(() => new MeshBasicMaterial({
        map: textureFromSpritesheet(42, 12, "transparent"),
        transparent: true,
        opacity: 0.9,
        // color: new Color("yellow"),
        side: THREE.DoubleSide,
    }));
    public animationOffset = 0;

    public object = new Object3D();

    public waters: Mesh[] = [];
    public sugars: Mesh[] = [];

    constructor(target: Inventory, scene: Scene, mito: Mito) {
        super(target, scene, mito);
        this.object.position.z = 1;
        for (let i = 0; i < this.target.water; i++) {
            this.createWaterMesh();
        }
        for (let i = 0; i < this.target.sugar; i++) {
            this.createWaterMesh();
        }

        // don't add to scene yourself
    }

    private updateMeshes(resource: number, array: Mesh[], create: () => void) {
        const wantedMeshes = Math.ceil(resource);
        while (array.length < wantedMeshes) {
            create();
        }
        while (array.length > wantedMeshes) {
            const mesh = array.shift()!;
            this.object.remove(mesh);
        }
        for (const mesh of array) {
            mesh.scale.set(InventoryRenderer.resourceMeshScale, InventoryRenderer.resourceMeshScale, 1);
        }
        const fract = resource - Math.floor(resource);
        if (array.length > 0 && fract > 0) {
            const scale = InventoryRenderer.resourceMeshScale * fract;
            const lastMesh = array[array.length - 1];
            lastMesh.scale.set(scale, scale, 1);
        }
    }

    quantize(v: Vector3, size: number) {
        const qv = v.clone();
        qv.x = Math.floor(v.x / size) * size;
        qv.y = Math.floor(v.y / size) * size;
        lerp2(v, qv, 0.9);
    }

    update() {
        this.updateMeshes(this.target.water, this.waters, () => this.createWaterMesh());
        this.updateMeshes(this.target.sugar, this.sugars, () => this.createSugarMesh());
        const resources = this.waters.concat(this.sugars);
        for (const r of resources) {
            const vel = r.position.clone();
            const angle = performance.now() / 3000 + this.animationOffset;
            vel.x += Math.cos(angle) * 0.2;
            // vel.y += Math.sin(performance.now() / 3000) * 0.1;
            const goTowardsCenterStrength = 0.1 + vel.length() * 0.1;
            vel.multiplyScalar(-goTowardsCenterStrength);
            for (const l of resources) {
                if (r === l) {
                    break;
                }
                const offset = r.position.clone().sub(l.position);
                const lengthSq = offset.lengthSq();
                if (lengthSq > 0) {
                    const strength = 0.003 / lengthSq;
                    vel.add(offset.multiplyScalar(strength));
                }
            }
            // this.quantize(vel, 0.1);
            r.position.add(vel);
            // this.quantize(r.position, 0.01);
        }
    }

    destroy() {
        // don't destroy yourself
    }

    static resourceMeshScale = .12;

    createWaterMesh() {
        const mesh = new Mesh(
            InventoryRenderer.geometry,
            InventoryRenderer.waterMaterial,
        );
        mesh.position.set((Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01, 0);
        mesh.scale.set(InventoryRenderer.resourceMeshScale, InventoryRenderer.resourceMeshScale, 1);
        this.object.add(mesh);
        this.waters.push(mesh);
    }

    createSugarMesh() {
        const mesh = new Mesh(
            InventoryRenderer.geometry,
            InventoryRenderer.sugarMaterial(),
        );
        // mesh.position.set(Math.random() - 0.5, Math.random() - 0.5, 0);
        mesh.position.set((Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01, 0);
        mesh.scale.set(InventoryRenderer.resourceMeshScale, InventoryRenderer.resourceMeshScale, 1);

        this.object.add(mesh);
        this.sugars.push(mesh);
    }

}

function createRendererFor<E extends Entity>(object: E, scene: Scene, mito: Mito): Renderer<Entity> {
    if (object instanceof Player) {
        return new PlayerRenderer(object, scene, mito);
    } else if (object instanceof Tile) {
        return new TileRenderer(object, scene, mito);
    } else {
        throw new Error(`Couldn't find renderer for ${object}`);
    }
}

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
    "w": {
        type: "move",
        dir: DIRECTIONS.n,
    },
    "a": {
        type: "move",
        dir: DIRECTIONS.w,
    },
    "s": {
        type: "move",
        dir: DIRECTIONS.s,
    },
    "d": {
        type: "move",
        dir: DIRECTIONS.e,
    },
    "q": {
        type: "move",
        dir: DIRECTIONS.nw,
    },
    "e": {
        type: "move",
        dir: DIRECTIONS.ne,
    },
    "z": {
        type: "move",
        dir: DIRECTIONS.sw,
    },
    "c": {
        type: "move",
        dir: DIRECTIONS.se,
    },
};

export const BUILD_HOTKEYS: { [key: string]: Constructor<Cell> } = {
    t: Tissue,
    l: Leaf,
    r: Root,
    F: Fruit,
    T: Transport,
};

export type GameState = "main" | "win" | "lose" | "instructions";

class Mito extends ISketch {
    public readonly world = new World();
    public scene = new Scene();
    private camera = new OrthographicCamera(0, 0, 0, 0, -100, 100);
    public renderers = new Map<Entity, Renderer<Entity>>();
    // when true, automatically create tissue tiles when walking into soil or dirt
    public autoplace: Constructor<Cell> | undefined;
    public elements = [
        <HUD
            ref={(ref) => this.hudRef = ref!}
            // onAutoplaceSet={(autoplace) => {
            //     if (autoplace === this.autoplace) {
            //         this.autoplace = undefined;
            //     } else {
            //         this.autoplace = autoplace;
            //     }
            //     this.hudRef.setState({ autoplace: this.autoplace });
            // }}
            onTryActionKey={(key) => {
                this.tryAction(key);
            }}
            world={this.world}
        />,
        <TileHover ref={(ref) => this.hoverRef = ref } />,
        <GameStack ref={(ref) => this.gameStackRef = ref } mito={this} />,
    ];
    public hudRef: HUD | null = null;
    public hoverRef: TileHover | null = null;
    public gameStackRef: GameStack | null = null;
    public mouse = new THREE.Vector2();
    public hoveredTile?: Tile;
    private raycaster = new THREE.Raycaster();
    public gameState: GameState = "instructions";
    public audioListener = new THREE.AudioListener();

    public events = {
        mousemove: (event: JQuery.Event) => {
            this.mouse.x = event.clientX!;
            this.mouse.y = event.clientY!;
            if (this.hoverRef != null) {
                this.hoverRef.setState({
                    left: this.mouse.x,
                    top: this.mouse.y,
                });
            }
        },
        click: (event: JQuery.Event) => {
            if (this.hoverRef != null) {
                this.hoverRef.setState({
                    show: !this.hoverRef.state.show,
                });
            }
        },
        keypress: (event: JQuery.Event) => {
            const key = event.key!;
            this.tryAction(key);
            event.stopPropagation();
        },
        keydown: (event: JQuery.Event) => {
            if (event.key! === "Escape") {
                this.tryAction(event.key!);
            }
        },
        wheel: (event: JQuery.Event) => {
            const e = event.originalEvent as WheelEvent;
            // on my mouse, one scroll is + or - 125
            const delta = -(e.deltaX + e.deltaY) / 125 / 20;
            const currZoom = this.camera.zoom;
            const scalar = Math.pow(2, delta);
            // console.log(currZoom);
            // zoom of 2 is zooming in
            // const newZoom = Math.min(Math.max(currZoom * scalar, 1), 2.5);
            const newZoom = currZoom * scalar;
            this.camera.zoom = newZoom;
            this.camera.updateProjectionMatrix();
        },
    };

    tryAction(key: string) {
        const { world } = this;
        if (key === "?") {
            this.gameState = (this.gameState === "instructions" ? "main" : "instructions");
            return;
        }
        if (this.gameState === "instructions") {
            if (key === "Escape") {
                this.gameState = "main";
            }
            // block further actions
            return;
        }
        const action = ACTION_KEYMAP[key];
        if (action != null) {
            // autoplace
            if (this.autoplace !== undefined && action.type === "move") {
                if (this.autoplace === Transport) {
                    const buildTransportAction: ActionBuildTransport = {
                        type: "build-transport",
                        cellType: Transport,
                        position: this.world.player.pos.clone(),
                        dir: action.dir,
                    };
                    this.world.player.action = buildTransportAction;
                } else if (!world.player.verifyMove(action)) {
                    const buildAction: ActionBuild = {
                        type: "build",
                        cellType: this.autoplace,
                        position: this.world.player.pos.clone().add(action.dir),
                    };
                    this.world.player.action = buildAction;
                    if (this.autoplace === Root || this.autoplace === Leaf || this.autoplace === Fruit) {
                        this.autoplace = undefined;
                    }
                } else {
                    this.world.player.action = action;
                }
            } else {
                this.world.player.action = action;
            }
        } else {
            if (key in BUILD_HOTKEYS) {
                if (this.autoplace === BUILD_HOTKEYS[key] || BUILD_HOTKEYS[key] === Fruit && this.world.fruit != null) {
                    this.autoplace = undefined;
                } else {
                    this.autoplace = BUILD_HOTKEYS[key];
                }
            }
        }
        if (this.hudRef != null) {
            this.hudRef.setState({ autoplace: this.autoplace });
        }
    }

    public init() {
        const { world } = this;
        hookUpAudio(this.audioContext);
        const aspect = this.aspectRatio;
        this.camera.zoom = 1.5;
        this.camera.add(this.audioListener);

        this.resize(this.canvas.width, this.canvas.height);
        // darkness and water diffuse a few times to stabilize it
        for (let i = 0; i < 5; i++) {
            this.world.player.action = { type: "still" };
            this.world.step();
        }
        // this.gameState = "instructions";
        this.camera.position.z = 10;
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.camera.position.x = this.world.player.pos.x;
        this.camera.position.y = this.world.player.pos.y;

        // const airBg = new THREE.Mesh(
        //     new PlaneBufferGeometry(width, height),
        //     materialMapping.get(Air)!.clone(),
        // );
        // airBg.position.x = width / 2 - 0.5;
        // airBg.position.y = height / 2 - 0.5;
        // this.scene.add(airBg);
        this.updateAmbientAudio();
    }

    public getOrCreateRenderer(entity: Entity) {
        const renderer = this.renderers.get(entity);
        if (renderer == null) {
            const created = createRendererFor(entity, this.scene, this);
            this.renderers.set(entity, created);
            return created;
        } else {
            return renderer;
        }
    }

    public updateAmbientAudio() {
        const { world } = this;
        const yPos = this.world.player.pos.y;
        const drumVolume = map(yPos, height / 2, height, 0, 0.5);
        const stringsVolume = map(yPos, height / 2, 0, 0, 0.5);
        drums.gain.gain.value = Math.max(0, drumVolume);
        strings.gain.gain.value = Math.max(0, stringsVolume);
    }

    public animate() {
        const { world } = this;
        if (document.activeElement !== this.canvas) {
            this.canvas.focus();
        }
        if (world.player.action != null) {
            this.world.step();
            this.gameState = this.world.checkWinLoss();

            const oldEntities = Array.from(this.renderers.keys());
            // delete the renderers for entities that have been removed since last render
            // this is the performance bottleneck, it's O(n^2)
            const renderableEntities = this.world.renderableEntities();
            const removedEntities = oldEntities.filter((e) => renderableEntities.indexOf(e) === -1);
            for (const e of removedEntities) {
                const renderer = this.renderers.get(e);
                if (renderer == null) {
                    throw new Error(`Couldn't find renderer for ${e}!`);
                }
                renderer.destroy();
                this.renderers.delete(e);
            }

            this.updateAmbientAudio();
        }
        // if (world.player.action == null) {
        //     this.world.player.action = { type: "still" };
        // }
        // this.world.step();
        // this.world.entities().forEach((entity) => {
        this.world.renderableEntities().forEach((entity) => {
            const renderer = this.getOrCreateRenderer(entity);
            renderer.update();
        });
        const mouseNorm = new THREE.Vector2(
            this.mouse.x / this.canvas.width * 2 - 1,
            -this.mouse.y / this.canvas.height * 2 + 1,
        );

        const target = new THREE.Vector2(
            this.world.player.pos.x + mouseNorm.x / 2,
            this.world.player.pos.y - mouseNorm.y / 2,
        );
        lerp2(this.camera.position, target, 0.3);
        this.renderer.render(this.scene, this.camera);

        // this.mouse.x = event.clientX! / this.canvas.width * 2 - 1;
        // this.mouse.y = -event.clientY! / this.canvas.height * 2 + 1;
        this.raycaster.setFromCamera(mouseNorm, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        const i = intersects[0];
        if (i != null) {
            const {x, y} = i.point;
            const ix = Math.round(x);
            const iy = Math.round(y);
            const thisHoveredTile = this.world.tileAt(ix, iy);
            if (thisHoveredTile != null) {
                if (thisHoveredTile.lightAmount() === 0) {
                    this.hoveredTile = undefined;
                } else {
                    this.hoveredTile = thisHoveredTile;
                }
                if (this.hoverRef != null) {
                    this.hoverRef.setState({
                        tile: this.hoveredTile,
                    });
                }
            }
        }
        if (this.hudRef != null) {
            this.hudRef.setState({
                sugar: this.world.player.inventory.sugar,
                water: this.world.player.inventory.water,
            });
        }
        if (this.gameStackRef != null) {
            this.gameStackRef.setState({
                state: this.gameState,
            });
        }
    }

    public resize(w: number, h: number) {
        const aspect = h / w;
        const cameraHeight = 12;
        this.camera.left = -cameraHeight / aspect;
        this.camera.right = cameraHeight / aspect;
        this.camera.top = -cameraHeight;
        this.camera.bottom = cameraHeight;
        // this.camera.position.z = 1;
        // this.camera.lookAt(new Vector3(0, 0, 0));
        this.camera.updateProjectionMatrix();
    }
}

export default Mito;
