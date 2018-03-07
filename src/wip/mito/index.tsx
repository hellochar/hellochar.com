import * as React from "react";
import * as THREE from "three";
import { Color, Geometry, Material, Mesh, MeshBasicMaterial, Object3D, OrthographicCamera, PlaneBufferGeometry, Scene, Vector2, Vector3 } from "three";

import { map, lerp } from "../../math/index";
import { ISketch, SketchAudioContext } from "../../sketch";
import { hasInventory, Inventory } from "./inventory";
import { Noise } from "./perlin";
import { textureFromSpritesheet } from "./spritesheet";
import { Air, Cell, CELL_ENERGY_MAX, CELL_SUGAR_BUILD_COST, DeadCell, hasEnergy, Leaf, Rock, Root, Seed, Soil, Tile, Tissue } from "./tile";
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
}

interface ActionStill {
    type: "still";
}

interface ActionMove {
    type: "move";
    dir: Vector2;
}

interface ActionBuild {
    type: "build";
    cellType: Constructor<Cell>;
    position: Vector2;
}

interface ActionDrop {
    type: "drop";
    water: number;
    sugar: number;
}

type Action = ActionStill | ActionMove | ActionBuild | ActionDrop;

class Player {
    public inventory = new Inventory(100, 50, 50);
    public action?: Action;
    public constructor(public pos: Vector2) {}

    public step() {
        if (this.action === undefined) {
            throw new Error("tried stepping player before action was filled in!");
        }
        this.attemptAction(this.action);
        this.action = undefined;
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
            case "drop":
                this.attemptDrop(action);
                break;
        }
    }

    public verifyMove(action: ActionMove) {
        const target = this.pos.clone().add(action.dir);
        const targetTile = world.tileAt(target.x, target.y);
        if (!(targetTile instanceof Tissue)) {
            // can't move!
            return false;
        }
        return true;
    }

    public attemptMove(action: ActionMove) {
        if (this.verifyMove(action)) {
            const target = world.wrappedPosition(this.pos.clone().add(action.dir));
            // do the move
            this.pos = target;
            this.autopickup();
        }
    }

    public attemptStill(action: ActionStill) {
        this.autopickup();
    }

    private autopickup() {
        // autopickup resources in the position as possible
        const targetTile = world.tileAt(this.pos.x, this.pos.y);
        if (hasInventory(targetTile)) {
            const inv = targetTile.inventory;
            inv.give(this.inventory, inv.water, inv.sugar);
        }
    }

    public attemptBuild(action: ActionBuild) {
        // if (this.pos.clone().sub(action.position).manhattanLength)
        // attempt to build. something.
        // just make every cell cost 25 water and 10 sugar for now
        // const waterCost = 25;
        // const sugarCost = 10;

        const targetTile = world.tileAt(action.position.x, action.position.y);

        // disallow building a seed if there already is one
        if (world.seed != null && action.cellType === Seed) {
            return;
        }

        // disallow building over a seed
        if (targetTile instanceof Seed) {
            return;
        }

        const waterCost = 1;
        const sugarCost = CELL_SUGAR_BUILD_COST;
        if (!(targetTile instanceof action.cellType) &&
            !(targetTile instanceof Rock) &&
            this.inventory.water >= waterCost &&
            this.inventory.sugar >= sugarCost) {
            const newTile = new action.cellType(action.position);
            world.setTileAt(action.position, newTile);
            this.inventory.change(-waterCost, -sugarCost);
            if (world.seed == null && newTile instanceof Seed) {
                world.seed = newTile;
            }
        }
    }

    public attemptDrop(action: ActionDrop) {
        // drop as much as you can onto the current tile
        const currentTile = world.tileAt(this.pos.x, this.pos.y);
        if (hasInventory(currentTile)) {
            const { water, sugar } = action;
            this.inventory.give(currentTile.inventory, water, sugar);
        }
    }
}

export const width = 50;
export const height = 100;
const DIRECTIONS = {
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

type Directions = keyof typeof DIRECTIONS;

const DIRECTION_NAMES = Object.keys(DIRECTIONS) as Directions[];
const DIRECTION_VALUES: Vector2[] = DIRECTION_NAMES.map((o) => DIRECTIONS[o]);
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

class World {
    private time: number = 0;
    public player: Player = new Player(new Vector2(width / 2, height / 2));
    public seed?: Seed = undefined;
    public grid: Tile[][] = (() => {
        // start with a half water half air
        const noiseWater = new Noise();
        const noiseRock = new Noise();
        const grid = new Array(width).fill(undefined).map((_, x) => (
            new Array(height).fill(undefined).map((__, y) => {
                const pos = new Vector2(x, y);
                if (y > height / 2) {
                    // const water = Math.floor(20 + Math.random() * 20);
                    const rockThreshold = map(y - height / 2, 0, height / 2, -0.7, 0.3);
                    const isRock = noiseRock.simplex2(x / 5, y / 5) < rockThreshold;
                    if (isRock) {
                        const rock = new Rock(pos);
                        return rock;
                    } else {
                        const heightScalar = Math.pow(map(y - height / 2, 0, height / 2, 0.5, 1), 2);
                        const simplexScalar = 0.2;
                        const simplexValue = noiseWater.simplex2(x * simplexScalar, y * simplexScalar) + 0.0;
                        // should be soil_max_water
                        const water = Math.max(
                            0,
                            Math.min(
                            20,
                            simplexValue > 0.5 ? 20 * heightScalar : 0, // Math.sqrt() * 100 * heightScalar;
                            ));
                        const soil = new Soil(pos, Math.round(water));
                        return soil;
                    }
                } else {
                    return new Air(pos);
                }
            })
        ));

        // add a "seed" of tissue around the player
        const radius = 2.5;
        for (let x = -Math.floor(radius); x <= Math.ceil(radius); x++) {
            for (let y = -Math.floor(radius); y <= Math.ceil(radius); y++) {
                if (x * x + y * y < radius * radius) {
                    const cx = this.player.pos.x + x;
                    const cy = this.player.pos.y + y;
                    const t = grid[cx][cy] = new Tissue(new Vector2(cx, cy));
                    // t.inventory.change(5, 5);
                }
            }
        }
        return grid;
    })();

    constructor() {
        this.fillCachedEntities();
    }

    public tileAt(x: number, y: number) {
        x = ((x % width) + width) % width;
        y = ((y % height) + height) % height;
        return this.grid[x][y];
    }

    public setTileAt(position: Vector2, tile: Tile): any {
        const {x, y} = this.wrappedPosition(position);
        const oldTile = this.grid[x][y];
        // if replacing a tile with inventory, try giving resources to neighbors of the same type
        if (hasInventory(oldTile)) {
            const neighbors = world.tileNeighbors(position);
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
            // there's a chance we just *lose* some water as it overfills capacity
        this.grid[x][y] = tile;
        this.fillCachedEntities();
    }

    public wrappedPosition(pos: Vector2) {
        let {x, y} = pos;
        x = ((x % width) + width) % width;
        y = ((y % height) + height) % height;
        return new Vector2(x, y);
    }

    public tileNeighbors(pos: Vector2) {
        const mapping = new Map<Vector2, Tile>();
        // randomize the neighbor array to reduce aliasing
        const directions = DIRECTION_VALUES_RAND[this.time % DIRECTION_VALUES_RAND.length];
        directions.forEach((v) => {
            mapping.set(v, this.tileAt(pos.x + v.x, pos.y + v.y));
        });
        return mapping;
    }

    private cachedEntities: Entity[];
    public entities() {
        return this.cachedEntities;
    }
    private fillCachedEntities() {
        // dear god
        const flattenedTiles: Tile[] = [];
        let x = 0, y = 0;
        for (x = 0; x < width; x++) {
            for (y = (x + this.time) % 2; y < height; y += 2) {
                // checkerboard
                flattenedTiles.push(this.grid[x][y]);
            }
        }
        for (x = 0; x < width; x++) {
            for (y = (x + this.time + 1) % 2; y < height; y += 2) {
                // opposite checkerboard
                flattenedTiles.push(this.grid[x][y]);
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
        const newEntities = ([] as Entity[]).concat(flattenedTiles, [this.player]);
        this.cachedEntities = newEntities;
    }

    // iterate through all the actions
    public step() {
        this.computeSunlight();
        const entities = this.entities();
        // dear god
        entities.forEach((entity) => {
            if (isSteppable(entity)) {
                entity.step();
            }
        });
        this.time++;
        this.fillCachedEntities();
        this.checkResources();
    }

    public computeSunlight() {
        // sunlight is special - we step downards from the top; neighbors don't affect the calculation so we don't have buffering problems
        // const directionalBias = Math.cos(this.time / 100);
        for (let y = 0; y <= height / 2; y++) {
            for (let x = 0; x < width; x++) {
                const t = world.tileAt(x, y);
                if (t instanceof Air) {
                    let sunlight = 0;
                    if (y === 0) {
                        sunlight = 1;
                    } else {
                        const tileUp = world.tileAt(x, y - 1);
                        const tileRight = world.tileAt(x + 1, y - 1);
                        const tileLeft = world.tileAt(x - 1, y - 1);
                        const upSunlight = tileUp instanceof Air ? tileUp.sunlightCached : 0;
                        const rightSunlight = tileRight instanceof Air ? tileRight.sunlightCached : 0;
                        const leftSunlight = tileLeft instanceof Air ? tileLeft.sunlightCached : 0;
                        // if (directionalBias > 0) {
                        //     // light travels to the right
                        //     sunlight = rightSunlight * directionalBias + upSunlight * (1 - directionalBias);
                        // } else {
                        //     sunlight = leftSunlight * -directionalBias + upSunlight * (1 - (-directionalBias));
                        // }
                        // sunlight = upSunlight * 0.5 + rightSunlight * 0.25 + leftSunlight * 0.25;
                        sunlight = (upSunlight + rightSunlight + leftSunlight) / 3;
                    }
                    // have at least a bit
                    sunlight = 0.1 + sunlight * 0.9;
                    t.sunlightCached = sunlight;
                }
            }
        }
    }

    public checkWinLoss(): GameState {
        // you win if there's a seed with > 800 resources
        if (this.seed != null) {
            if (this.seed.inventory.sugar + this.seed.inventory.water > 800) {
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
        console.log("sugar", totalSugar, "water", totalWater, "energy", totalEnergy);
    }
}

function lerp2(v: Vector3, t: {x: number, y: number}, l: number) {
    v.x = v.x * (1 - l) + t.x * l;
    v.y = v.y * (1 - l) + t.y * l;
}

export const world = new World();

abstract class Renderer<T> {
    constructor(public target: T, public scene: Scene) { }

    abstract init(): void;

    abstract update(): void;

    abstract destroy(): void;
}

class PlayerRenderer extends Renderer<Player> {
    public mesh: Mesh;
    init() {
        this.mesh = new Mesh(
            new PlaneBufferGeometry(1, 1),
            // new THREE.CircleBufferGeometry(0.5, 20),
            new MeshBasicMaterial({
                transparent: true,
                map: textureFromSpritesheet(29, 12, "transparent"),
                color: new Color("white"),
                side: THREE.DoubleSide,
            }),
        );
        lerp2(this.mesh.position, this.target.pos, 1);
        this.mesh.position.z = 2;
        this.scene.add(this.mesh);
    }

    update() {
        lerp2(this.mesh.position, this.target.pos, 0.5);
        this.mesh.position.z = 2;
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}

const materialMapping = new Map<Constructor<Tile>, Material>();
materialMapping.set(Air, new MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: new Color("rgb(209, 243, 255)"),
}));
materialMapping.set(Soil, new MeshBasicMaterial({
    map: textureFromSpritesheet(8, 11),
    // map: textureFromSpritesheet(41, 26),
    side: THREE.DoubleSide,
    // color: new Color(0x808080),
    color: new Color(0x554321),
}));
materialMapping.set(Rock, new MeshBasicMaterial({
    map: textureFromSpritesheet(26, 20),
    side: THREE.DoubleSide,
    color: new Color("rgb(63, 77, 84)"),
}));
materialMapping.set(DeadCell, new MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: new Color("rgb(128, 128, 128)"),
}));
materialMapping.set(Tissue, new MeshBasicMaterial({
    map: textureFromSpritesheet(6, 31),
    side: THREE.DoubleSide,
    color: new Color(0x30ae25),
}));
materialMapping.set(Leaf, new MeshBasicMaterial({
    map: textureFromSpritesheet(9, 31),
    // map: textureFromSpritesheet(16, 10),
    side: THREE.DoubleSide,
    // color: new Color(),
}));
materialMapping.set(Root, new MeshBasicMaterial({
    map: textureFromSpritesheet(0, 31),
    side: THREE.DoubleSide,
    // color: new Color("lightgreen"),
}));
materialMapping.set(Seed, new MeshBasicMaterial({
    map: textureFromSpritesheet(9, 31),
    side: THREE.DoubleSide,
    color: new Color("rgb(249, 243, 49)"),
}));

function getMaterial(tile: Tile) {
    // careful - creates a new instance per tile
    return materialMapping.get(tile.constructor as Constructor<Tile>)!.clone();
}

class TileRenderer extends Renderer<Tile> {
    public object = new Object3D();
    public mesh: Mesh;
    static geometry = new PlaneBufferGeometry(1, 1);
    static eatingMaterial = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        map: textureFromSpritesheet(53, 28, "transparent"),
        transparent: true,
        opacity: 0.3,
        color: new THREE.Color("white"),
    });
    private inventoryRenderer: InventoryRenderer;
    private originalColor: THREE.Color;
    private eatingMesh = new Mesh(
        TileRenderer.geometry,
        TileRenderer.eatingMaterial,
    );

    init() {
        const mat = getMaterial(this.target) as MeshBasicMaterial;
        this.mesh = new Mesh(
            TileRenderer.geometry,
            mat,
        );
        this.eatingMesh.position.set(0, 0.4, 0);
        this.eatingMesh.scale.set(0.2, 0.2, 1);
        this.originalColor = mat.color.clone();
        this.object.add(this.mesh);

        if (hasInventory(this.target)) {
            this.inventoryRenderer = new InventoryRenderer(this.target.inventory, this.scene);
            this.inventoryRenderer.init();
            this.inventoryRenderer.animationOffset = (this.target.pos.x + this.target.pos.y) / 2;
            this.object.add(this.inventoryRenderer.object);
        }
        this.scene.add(this.object);
        // for now
        this.object.scale.set(0.01, 0.01, 1);
    }

    update() {
        lerp2(this.object.scale, new THREE.Vector2(1, 1), 0.1);
        let lightAmount = Math.sqrt(Math.min(Math.max(map(1 - this.target.darkness, 0, 1, 0, 1), 0), 1));
        if (this.target instanceof Air) {
            // lightAmount *= (1 + this.target.sunlight()) / 2;
            lightAmount = this.target.sunlight();
            // shadowAmount = this.target.sunlight();
        }
        const mat = this.mesh.material as MeshBasicMaterial;
        mat.color = new THREE.Color(0).lerp(this.originalColor, lightAmount);
        this.object.position.set(this.target.pos.x, this.target.pos.y, 0);
        if (this.target instanceof Cell) {
            if (this.target.metabolism.type === "eating") {
                this.eatingMesh.position.z = 1;
                this.object.add(this.eatingMesh);
            } else {
                this.object.remove(this.eatingMesh);
            }
        }
        if (hasEnergy(this.target)) {
            this.mesh.material.transparent = true;
            this.mesh.material.opacity = this.target.energy / CELL_ENERGY_MAX;
        }
        if (this.inventoryRenderer != null) {
            this.inventoryRenderer.update();
            if (lightAmount === 0) {
                this.inventoryRenderer.object.visible = false;
            } else {
                this.inventoryRenderer.object.visible = true;
            }
        }
    }

    destroy() {
        this.scene.remove(this.object);
        if (this.inventoryRenderer != null) {
            this.inventoryRenderer.destroy();
        }
    }
}

const RESOURCES_PER_MESH = 1;

// we represent Resources as dots of certain colors.
class InventoryRenderer extends Renderer<Inventory> {
    static geometry = new PlaneBufferGeometry(1, 1);
    static waterMaterial = new MeshBasicMaterial({
        // map: textureFromSpritesheet(0, 1),
        transparent: true,
        opacity: 0.75,
        color: new Color("rgb(9, 12, 255)"),
        side: THREE.DoubleSide,
    });
    static sugarMaterial = new MeshBasicMaterial({
        map: textureFromSpritesheet(42, 12, "transparent"),
        transparent: true,
        opacity: 0.9,
        // color: new Color("yellow"),
        side: THREE.DoubleSide,
    });
    public animationOffset: number;

    public object = new Object3D();

    public waters: Mesh[] = [];
    public sugars: Mesh[] = [];

    init() {
        this.object.position.z = 1;
        for (let i = 0; i < this.target.water / RESOURCES_PER_MESH; i++) {
            this.createWaterMesh();
        }
        for (let i = 0; i < this.target.sugar / RESOURCES_PER_MESH; i++) {
            this.createWaterMesh();
        }

        // don't add to scene yourself
    }

    private updateMeshes(resource: number, array: Mesh[], create: () => void) {
        const wantedMeshes = Math.ceil(resource / RESOURCES_PER_MESH);
        while (array.length < wantedMeshes) {
            create();
        }
        while (array.length > wantedMeshes) {
            const mesh = array.shift()!;
            this.object.remove(mesh);
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
            const pullStrength = 0.1 + vel.length() * 0.1;
            vel.multiplyScalar(-pullStrength);
            for (const l of resources) {
                if (r === l) {
                    break;
                }
                const offset = r.position.clone().sub(l.position);
                const lengthSq = offset.lengthSq();
                if (lengthSq > 0) {
                    const strength = 0.005 / lengthSq;
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

    createWaterMesh() {
        const mesh = new Mesh(
            InventoryRenderer.geometry,
            InventoryRenderer.waterMaterial,
        );
        mesh.position.set(Math.random() - 0.5, Math.random() - 0.5, 0);
        mesh.scale.set(0.12, 0.12, 1);
        this.object.add(mesh);
        this.waters.push(mesh);
    }

    createSugarMesh() {
        const mesh = new Mesh(
            InventoryRenderer.geometry,
            InventoryRenderer.sugarMaterial,
        );
        mesh.position.set(Math.random() - 0.5, Math.random() - 0.5, 0);
        mesh.scale.set(0.12, 0.12, 1);

        this.object.add(mesh);
        this.sugars.push(mesh);
    }

}

function createRendererFor<E extends Entity>(object: E, scene: Scene): Renderer<Entity> {
    if (object instanceof Player) {
        return new PlayerRenderer(object, scene);
    } else if (object instanceof Tile) {
        return new TileRenderer(object, scene);
    } else {
        throw new Error(`Couldn't find renderer for ${object}`);
    }
}

const ACTION_KEYMAP: { [key: string]: Action } = {
    "1": {
        type: "drop",
        sugar: 0,
        water: 20, // hack hack we can assume max 100 water, it's fine
    },
    "2": {
        type: "drop",
        sugar: 20,
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

const AUTOPLACE_LIST: Array<Constructor<Cell> | undefined> = [undefined, Tissue, Leaf, Root];

export type GameState = "main" | "win" | "lose";

const Mito = new (class extends ISketch {
    public scene = new Scene();
    private camera: THREE.OrthographicCamera;
    public renderers = new Map<Entity, Renderer<Entity>>();
    // when true, automatically create tissue tiles when walking into soil or dirt
    public autoplace: Constructor<Cell> | undefined;
    public elements = [
        <HUD ref={(ref) => this.hudRef = ref! } />,
        <TileHover ref={(ref) => this.hoverRef = ref! } />,
        <GameStack ref={(ref) => this.gameStackRef = ref! } />,
    ];
    public hudRef: HUD;
    public hoverRef: TileHover;
    public gameStackRef: GameStack;
    public mouse = new THREE.Vector2();
    public hoveredTile: Tile;
    private raycaster = new THREE.Raycaster();
    public gameState: GameState = "main";

    public events = {
        mousemove: (event: JQuery.Event) => {
            this.mouse.x = event.clientX!;
            this.mouse.y = event.clientY!;
            this.hoverRef.setState({
                left: this.mouse.x,
                top: this.mouse.y,
            });
            // this.mouse.x = event.clientX! / this.canvas.width * 2 - 1;
            // this.mouse.y = -event.clientY! / this.canvas.height * 2 + 1;
        },
        click: (event: JQuery.Event) => {
            this.hoverRef.setState({
                show: !this.hoverRef.state.show,
            });
        },
        keypress: (event: JQuery.Event) => {
            const key = event.key!;
            const action = ACTION_KEYMAP[key];
            if (action != null) {
                // autoplace
                if (this.autoplace !== undefined
                    && action.type === "move"
                    && !world.player.verifyMove(action)) {
                        const buildTissueAction: ActionBuild = {
                            type: "build",
                            cellType: this.autoplace,
                            position: world.player.pos.clone().add(action.dir),
                        };
                        world.player.action = buildTissueAction;
                } else {
                    world.player.action = action;
                }
            } else {
                // go into autoplace tissue
                if (key === 't') {
                    this.autoplace = Tissue;
                    // const currAutoplaceIndex = AUTOPLACE_LIST.indexOf(this.autoplace);
                    // const nextIndex = (currAutoplaceIndex + 1) % AUTOPLACE_LIST.length;
                    // this.autoplace = AUTOPLACE_LIST[nextIndex];
                    this.hudRef.setState({ autoplace: this.autoplace });
                } else if (key === 'l') {
                    this.autoplace = Leaf;
                    this.hudRef.setState({ autoplace: this.autoplace });
                } else if (key === 'r') {
                    this.autoplace = Root;
                    this.hudRef.setState({ autoplace: this.autoplace });
                } else if (key === 'f') {
                    this.autoplace = Seed;
                    this.hudRef.setState({ autoplace: this.autoplace });
                } else if (key === ' ') {
                    this.autoplace = undefined;
                    this.hudRef.setState({ autoplace: this.autoplace });
                }
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

    public init() {
        // this.camera = new OrthographicCamera(0, width, 0, height, -100, 100);
        const aspect = this.aspectRatio;
        this.camera = new OrthographicCamera(0, 0, 0, 0, -100, 100);
        this.camera.zoom = 1.5;
        this.resize(this.canvas.width, this.canvas.height);
        // darkness and water diffuse a few times to stabilize it
        for (let i = 0; i < 5; i++) {
            world.player.action = { type: "still" };
            world.step();
        }
        this.gameState = "main";
        this.camera.position.x = world.player.pos.x;
        this.camera.position.y = world.player.pos.y;
    }

    public getOrCreateRenderer(entity: Entity) {
        const renderer = this.renderers.get(entity);
        if (renderer == null) {
            const created = createRendererFor(entity, this.scene);
            created.init();
            this.renderers.set(entity, created);
            return created;
        } else {
            return renderer;
        }
    }

    public animate() {
        if (world.player.action != null) {
            world.step();
            this.gameState = world.checkWinLoss();
        }
        // if (world.player.action == null) {
        //     world.player.action = { type: "still" };
        // }
        // world.step();
        const oldEntities = Array.from(this.renderers.keys());
        // delete the renderers for entities that have been removed since last render
        // this is the performance bottleneck, it's O(n^2)
        const removedEntities = oldEntities.filter((e) => world.entities().indexOf(e) === -1);
        for (const e of removedEntities) {
            const renderer = this.renderers.get(e);
            if (renderer == null) {
                throw new Error(`Couldn't find renderer for ${e}!`);
            }
            renderer.destroy();
            this.renderers.delete(e);
        }
        world.entities().forEach((entity) => {
            const renderer = this.getOrCreateRenderer(entity);
            renderer.update();
        });
        const mouseNorm = new THREE.Vector2(
            this.mouse.x / this.canvas.width * 2 - 1,
            -this.mouse.y / this.canvas.height * 2 + 1,
        );

        const target = new THREE.Vector2(
            world.player.pos.x + mouseNorm.x / 2,
            world.player.pos.y - mouseNorm.y / 2,
        );
        lerp2(this.camera.position, target, 0.3);
        this.renderer.render(this.scene, this.camera);

        // this.mouse.x = event.clientX! / this.canvas.width * 2 - 1;
        // this.mouse.y = -event.clientY! / this.canvas.height * 2 + 1;
        this.raycaster.setFromCamera(mouseNorm, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        // console.log(intersects);
        const i = intersects[0];
        if (i != null) {
            const {x, y} = i.point;
            const ix = Math.round(x);
            const iy = Math.round(y);
            const thisHoveredTile = world.tileAt(ix, iy);
            if (thisHoveredTile !== this.hoveredTile) {
                // this.hoverRef.setState({
                    // show: true,
                // });
            }
            this.hoveredTile = thisHoveredTile;
            this.hoverRef.setState({
                tile: this.hoveredTile,
            });
        }
        this.hudRef.setState({
            sugar: world.player.inventory.sugar,
            water: world.player.inventory.water,
        });
        this.gameStackRef.setState({
            state: this.gameState,
        });
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
})();

export default Mito;
