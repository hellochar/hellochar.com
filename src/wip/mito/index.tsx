import * as React from "react";
import * as THREE from "three";
import { Color, Geometry, Material, Mesh, MeshBasicMaterial, Object3D, OrthographicCamera, PlaneBufferGeometry, Scene, Vector2, Vector3 } from "three";

import { BufferAttribute } from "three";
import { lerp, map } from "../../math/index";
import { ISketch, SketchAudioContext } from "../../sketch";
import { hasInventory, Inventory } from "./inventory";
import { Noise } from "./perlin";
import { arrowUpMaterial, textureFromSpritesheet } from "./spritesheet";
import { Air, Cell, CELL_ENERGY_MAX, CELL_SUGAR_BUILD_COST, DeadCell, Fountain, hasEnergy, Leaf, Rock, Root, Seed, Soil, Tile, Tissue, Transport } from "./tile";
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

interface ActionBuildTransport {
    type: "build-transport";
    cellType: Constructor<Transport>;
    position: Vector2;
    dir: Vector2;
}

interface ActionDrop {
    type: "drop";
    water: number;
    sugar: number;
}

type Action = ActionStill | ActionMove | ActionBuild | ActionBuildTransport | ActionDrop;

class Player {
    public inventory = new Inventory(100, 50, 50);
    public action?: Action;
    public constructor(public pos: Vector2) {}

    public droopPos() {
        const tile = world.tileAt(this.pos.x, this.pos.y);
        if (tile instanceof Cell) {
            const t = this.pos.clone();
            t.y += tile.droopY;
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
        const tile = world.tileAt(this.pos.x, this.pos.y);
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

    public tryConstructingNewCell<T>(position: Vector2, cellType: Constructor<T>) {
        const targetTile = world.tileAt(position.x, position.y);

        // disallow building a seed if there already is one
        // todo fix typings on constructor vs typeof
        if (world.seed != null && (cellType as any) === Seed) {
            return;
        }

        // disallow building over a seed
        if (targetTile instanceof Seed) {
            return;
        }

        const waterCost = 1;
        const sugarCost = CELL_SUGAR_BUILD_COST;
        if (!(targetTile instanceof cellType) &&
            !(targetTile instanceof Rock) &&
            this.inventory.water >= waterCost &&
            this.inventory.sugar >= sugarCost) {
            this.inventory.change(-waterCost, -sugarCost);
            const newTile = new cellType(position);
            return newTile;
        } else {
            return undefined;
        }
    }

    public attemptBuild(action: ActionBuild) {
        const newCell = this.tryConstructingNewCell(action.position, action.cellType);
        if (newCell != null) {
            world.setTileAt(action.position, newCell);
            if (world.seed == null && newCell instanceof Seed) {
                world.seed = newCell;
            }
        }
    }

    public attemptBuildTransport(action: ActionBuildTransport) {
        const newCell = this.tryConstructingNewCell(action.position, action.cellType);
        if (newCell != null) {
            newCell.dir = action.dir;
            world.setTileAt(action.position, newCell);
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

class World {
    private time: number = 0;
    public player: Player = new Player(new Vector2(width / 2, height / 2));
    public seed?: Seed = undefined;
    public grid: Tile[][] = (() => {
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
                        const rock = new Rock(pos);
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
                                        simplexValue > 0.5 ? 20 * heightScalar : 0, // Math.sqrt() * 100 * heightScalar;
                                    )));
                        if (heightScalar > 0.75 && simplexValue > 1) {
                            return new Fountain(pos, water);
                        } else {
                            return new Soil(pos, water);
                        }
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
        const newEntities = ([this.player] as Entity[]).concat(flattenedTiles);
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
        const directionalBias = Math.cos(this.time * Math.PI * 2 / 2000);
        for (let y = 0; y <= height * 0.6; y++) {
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
                        if (directionalBias > 0) {
                            // light travels to the right
                            sunlight = rightSunlight * directionalBias + upSunlight * (1 - directionalBias);
                        } else {
                            sunlight = leftSunlight * -directionalBias + upSunlight * (1 - (-directionalBias));
                        }
                        // sunlight = upSunlight * 0.5 + rightSunlight * 0.25 + leftSunlight * 0.25;
                        sunlight = sunlight * 0.5 + ((upSunlight + rightSunlight + leftSunlight) / 3) * 0.5;
                    }
                    // have at least a bit
                    sunlight = 0.03 + sunlight * 0.97;
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
        if (this.seed != null) {
            if (this.seed.inventory.sugar === this.seed.inventory.capacity) {
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
        lerp2(this.mesh.position, this.target.droopPos(), 0.5);
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
materialMapping.set(Fountain, new MeshBasicMaterial({
    map: textureFromSpritesheet(56 / 16, 38 / 16),
    side: THREE.DoubleSide,
}));
materialMapping.set(Rock, new MeshBasicMaterial({
    map: textureFromSpritesheet(26, 20),
    side: THREE.DoubleSide,
    color: new Color("rgb(63, 77, 84)"),
}));
materialMapping.set(DeadCell, new MeshBasicMaterial({
    map: textureFromSpritesheet(137 / 16, 374 / 16),
    side: THREE.DoubleSide,
    color: new Color("rgb(128, 128, 128)"),
}));
materialMapping.set(Tissue, new MeshBasicMaterial({
    map: textureFromSpritesheet(6, 31),
    side: THREE.DoubleSide,
    color: new Color(0x30ae25),
}));
materialMapping.set(Transport, materialMapping.get(Tissue)!);
// materialMapping.set(Transport, new MeshBasicMaterial({
//     map: arrowUpMaterial(),
//     side: THREE.DoubleSide,
//     color: new THREE.Color("rgb(42, 138, 25)"),
// }));
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
    static eatingMaterial = new MeshBasicMaterial({
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
        // const geom = (this.target instanceof Transport) ? TileRenderer.geometry.clone() : TileRenderer.geometry;
        const geom = TileRenderer.geometry;
        this.mesh = new Mesh(
            geom,
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
        if (this.target instanceof Cell) {
            this.object.scale.set(0.01, 0.01, 1);
        }

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
    }

    update() {
        lerp2(this.object.scale, new THREE.Vector2(1, 1), 0.1);
        const lightAmount = this.target.lightAmount();
        const mat = this.mesh.material as MeshBasicMaterial;
        mat.color = new THREE.Color(0).lerp(this.originalColor, lightAmount);
        this.object.position.set(this.target.pos.x, this.target.pos.y, 0);
        if (this.target instanceof Cell) {
            // this.object.position.x += this.target.offset.x;
            // this.object.position.y += this.target.offset.y;
            this.object.position.y += this.target.droopY;
            if (this.target.metabolism.type === "eating") {
                this.eatingMesh.position.z = 1;
                this.object.add(this.eatingMesh);
            } else {
                this.object.remove(this.eatingMesh);
            }

            // if (this.target instanceof Transport) {
            //     const geom = this.mesh.geometry as PlaneBufferGeometry;
            //     const uvs = geom.getAttribute("uv") as BufferAttribute;
            //     uvs.setDynamic(true);
            //     for (let i = 0; i < uvs.count; i++) {
            //         uvs.setX(i, uvs.getX(i) + this.target.dir.x * 0.01);
            //         uvs.setY(i, uvs.getY(i) + this.target.dir.y * 0.01);
            //     }
            // }
        }
        if (hasEnergy(this.target)) {
            mat.color.lerp(new THREE.Color(0), 1 - this.target.energy / CELL_ENERGY_MAX);
            // this.mesh.material.transparent = true;
            // this.mesh.material.opacity = this.target.energy / CELL_ENERGY_MAX;
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
    public hoveredTile?: Tile;
    private raycaster = new THREE.Raycaster();
    public gameState: GameState = "main";

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
            this.hoverRef.setState({
                show: !this.hoverRef.state.show,
            });
        },
        keypress: (event: JQuery.Event) => {
            const key = event.key!;
            const action = ACTION_KEYMAP[key];
            if (action != null) {
                // autoplace
                if (this.autoplace !== undefined && action.type === "move") {
                    if (this.autoplace === Transport) {
                        const buildTransportAction: ActionBuildTransport = {
                            type: "build-transport",
                            cellType: Transport,
                            position: world.player.pos.clone(),
                            dir: action.dir,
                        };
                        world.player.action = buildTransportAction;
                    } else if (!world.player.verifyMove(action)) {
                        const buildAction: ActionBuild = {
                            type: "build",
                            cellType: this.autoplace,
                            position: world.player.pos.clone().add(action.dir),
                        };
                        world.player.action = buildAction;
                        if (this.autoplace === Root || this.autoplace === Leaf) {
                            this.autoplace = undefined;
                        }
                    } else {
                        world.player.action = action;
                    }
                } else {
                    world.player.action = action;
                }
            } else {
                // go into autoplace tissue
                if (key === 't') {
                    this.autoplace = Tissue;
                } else if (key === 'T') {
                    this.autoplace = Transport;
                } else if (key === 'l') {
                    this.autoplace = Leaf;
                } else if (key === 'r') {
                    this.autoplace = Root;
                } else if (key === 'f') {
                    this.autoplace = Seed;
                } else if (key === ' ') {
                    this.autoplace = undefined;
                }
            }
            this.hudRef.setState({ autoplace: this.autoplace });
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

        const airBg = new THREE.Mesh(
            new PlaneBufferGeometry(width, height),
            materialMapping.get(Air)!.clone(),
        );
        airBg.position.x = width / 2 - 0.5;
        airBg.position.y = height / 2 - 0.5;
        this.scene.add(airBg);
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
        }
        // if (world.player.action == null) {
        //     world.player.action = { type: "still" };
        // }
        // world.step();
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
            if (thisHoveredTile.lightAmount() === 0) {
                this.hoveredTile = undefined;
            } else {
                this.hoveredTile = thisHoveredTile;
            }
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
