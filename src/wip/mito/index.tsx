import * as React from "react";
import * as THREE from "three";
import { Color, Geometry, Material, Mesh, MeshBasicMaterial, Object3D, OrthographicCamera, PerspectiveCamera, PlaneBufferGeometry, Scene, ShaderMaterial, SphereBufferGeometry, SphereGeometry, Vector2, Vector3 } from "three";

import { map } from "../../math/index";
import { ISketch, SketchAudioContext } from "../../sketch";
import { hasInventory, Inventory } from "./inventory";
import { Noise } from "./perlin";
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
    public inventory = new Inventory(1000, 100, 800);
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
        const waterCost = 1;
        const sugarCost = CELL_SUGAR_BUILD_COST;
        const targetTile = world.tileAt(action.position.x, action.position.y);
        if (!(targetTile instanceof action.cellType) &&
            !(targetTile instanceof Rock) &&
            this.inventory.water >= waterCost &&
            this.inventory.sugar >= sugarCost) {
            // if replacing a tile with inventory, try giving resources to neighbors
            if (hasInventory(targetTile)) {
                const neighbors = world.tileNeighbors(action.position);
                for (const neighbor of neighbors.values()) {
                    if (hasInventory(neighbor)) {
                        targetTile.inventory.give(neighbor.inventory, targetTile.inventory.water, targetTile.inventory.sugar);
                    }
                    if (targetTile.inventory.water === 0 && targetTile.inventory.sugar === 0) {
                        // we're all done
                        break;
                    }
                }
            }
            // there's a chance we just *lose* some water as it overfills capacity
            const newTile = new action.cellType(action.position);
            world.setTileAt(action.position, newTile);
            this.inventory.change(-waterCost, -sugarCost);
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

const width = 50;
const height = 100;
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
                    const rockThreshold = map(y - height / 2, 0, height / 2, -0.7, 0.7);
                    const isRock = noiseRock.simplex2(x / 5, y / 5) < rockThreshold;
                    if (isRock) {
                        const rock = new Rock(pos);
                        return rock;
                    } else {
                        const heightScalar = Math.pow(map(y - height / 2, 0, height / 2, 0.25, 1), 2);
                        const simplexScalar = 0.2;
                        const simplexValue = Math.max(noiseWater.simplex2(x * simplexScalar, y * simplexScalar), 0);
                        const water = simplexValue > 0.5 ? 100 : 0; // Math.sqrt() * 100 * heightScalar;
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

    public checkWinLoss(): GameState {
        // you win if there's a seed with > 8000 sugar
        if (this.seed != null) {
            if (this.seed.inventory.sugar > 8000) {
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
            new THREE.CircleBufferGeometry(0.5, 20),
            new MeshBasicMaterial({
                color: new Color("lightgreen"),
                side: THREE.DoubleSide,
            }),
        );
        this.scene.add(this.mesh);
    }

    update() {
        this.mesh.position.set(this.target.pos.x, this.target.pos.y, 2);
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}

const materialMapping = new Map<Constructor<Tile>, Material>();
materialMapping.set(Air, new MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: new Color("lightblue"),
}));
materialMapping.set(Soil, new MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: new Color(0x654321),
}));
materialMapping.set(DeadCell, new MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: new Color(0),
}));
materialMapping.set(Tissue, new MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: new Color("darkgreen"),
}));
materialMapping.set(Leaf, new MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: new Color(0x3d860b),
}));
materialMapping.set(Root, new MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: new Color(0x8f6c63),
}));
materialMapping.set(Seed, new MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: new Color("rgb(249, 243, 49)"),
}));
materialMapping.set(Rock, new MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: new Color("rgb(12, 18, 51)"),
}));

function getMaterial(tile: Tile) {
    // careful - creates a new instance per tile
    return materialMapping.get(tile.constructor as Constructor<Tile>)!.clone();
}

const spriteSize = 16; // 16x16 sprites
const spriteSheetWidth = 1024;
const spriteSheetHeight = 512;
const SPRITESHEET = new THREE.TextureLoader().load( '/assets/images/roguelikeSheet_transparent.png' );
SPRITESHEET.magFilter = THREE.NearestFilter;
SPRITESHEET.repeat.set(spriteSize / spriteSheetWidth, spriteSize / spriteSheetHeight);
SPRITESHEET.flipY = true;
// SPRITESHEET.offset.set(16 / 1024 * 50, 16 / 512 * 0);
// console.log(SPRITESHEET);

const cache: { [key: string]: THREE.Texture } = {};
// x, y are spritesheet coordinates
function textureFromSpritesheet(x: number, y: number) {
    const key = `${x},${y}`;
    if (cache[key] == null) {
        const texture = new THREE.TextureLoader().load( '/assets/images/roguelikeSheet_transparent.png' );
        texture.magFilter = THREE.NearestFilter;
        texture.repeat.set(spriteSize / spriteSheetWidth, spriteSize / spriteSheetHeight);
        texture.flipY = true;
        texture.offset.set(spriteSize / spriteSheetWidth * x, spriteSize / spriteSheetHeight * y);
        cache[key] = texture;
    }
    return cache[key];
}

class TileRenderer extends Renderer<Tile> {
    public object = new Object3D();
    public mesh: Mesh;
    static geometry = new PlaneBufferGeometry(1, 1);
    static eatingMaterial = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        map: textureFromSpritesheet(50, 0),
        transparent: true,
        opacity: 0.8,
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
        this.eatingMesh.scale.set(0.25, 0.25, 1);
        this.originalColor = mat.color.clone();
        this.object.add(this.mesh);

        if (hasInventory(this.target)) {
            this.inventoryRenderer = new InventoryRenderer(this.target.inventory, this.scene);
            this.inventoryRenderer.init();
            this.object.add(this.inventoryRenderer.object);
        }
        this.scene.add(this.object);
    }

    update() {
        const darknessAmount = Math.sqrt(Math.min(Math.max(map(this.target.darkness - 1, 0, 2, 0, 1), 0), 1));
        const mat = this.mesh.material as MeshBasicMaterial;
        mat.color = this.originalColor.clone().lerp(new THREE.Color(0), darknessAmount);
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
            if (darknessAmount === 1) {
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

// we represent Resources as dots of certain colors.
class InventoryRenderer extends Renderer<Inventory> {
    public object = new Object3D();
    static geometry = new PlaneBufferGeometry(1, 1);
    static waterMaterial = new MeshBasicMaterial({
        transparent: true,
        opacity: 0.5,
        color: new Color("blue"),
        side: THREE.DoubleSide,
    });
    static sugarMaterial = new MeshBasicMaterial({
        transparent: true,
        opacity: 0.5,
        color: new Color("yellow"),
        side: THREE.DoubleSide,
    });
    private waterMesh = new Mesh(
        InventoryRenderer.geometry,
        InventoryRenderer.waterMaterial,
    );
    private sugarMesh = new Mesh(
        InventoryRenderer.geometry,
        InventoryRenderer.sugarMaterial,
    );

    init() {
        this.waterMesh.position.x = -0.25;
        this.sugarMesh.position.x = +0.25;
        // this.object.add(this.waterMesh);
        // this.object.add(this.sugarMesh);
        this.object.position.z = 1;
        // don't add to scene yourself
     }

    update() {
        const waterScale = this.target.water / this.target.capacity;
        const sugarScale = this.target.sugar / this.target.capacity;
        if (waterScale === 0) {
            this.object.remove(this.waterMesh);
        } else {
            this.object.add(this.waterMesh);
        }
        if (sugarScale === 0) {
            this.object.remove(this.sugarMesh);
        } else {
            this.object.add(this.sugarMesh);
        }
        this.waterMesh.scale.set(waterScale, waterScale, 1);
        this.sugarMesh.scale.set(sugarScale, sugarScale, 1);
    }

    destroy() {
        // don't destroy yourself
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
            const newZoom = Math.min(Math.max(currZoom * scalar, 1), 2.5);
            this.camera.zoom = newZoom;
            this.camera.updateProjectionMatrix();
        },
    };

    public init() {
        // this.camera = new OrthographicCamera(0, width, 0, height, -100, 100);
        const aspect = this.aspectRatio;
        this.camera = new OrthographicCamera(0, 0, 0, 0, -100, 100);
        this.resize(this.canvas.width, this.canvas.height);
        // darkness and water diffuse a few times to stabilize it
        for (let i = 0; i < 5; i++) {
            world.player.action = { type: "still" };
            world.step();
        }
        this.gameState = "main";
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

        this.camera.position.x = world.player.pos.x + mouseNorm.x / 2;
        this.camera.position.y = world.player.pos.y - mouseNorm.y / 2;
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
