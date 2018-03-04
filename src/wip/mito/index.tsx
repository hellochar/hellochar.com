import * as React from "react";
import * as THREE from "three";
import { Color, Geometry, Material, Mesh, MeshBasicMaterial, Object3D, OrthographicCamera, PerspectiveCamera, PlaneBufferGeometry, Scene, ShaderMaterial, SphereBufferGeometry, SphereGeometry, Vector2, Vector3 } from "three";

import { ISketch, SketchAudioContext } from "../../sketch";
import { hasInventory, Inventory } from "./inventory";
import { simplex2 } from "./perlin";
import { Air, Cell, CELL_ENERGY_MAX, DeadCell, hasEnergy, Leaf, Root, Seed, Soil, Tile, Tissue } from "./tile";
import { HUD, TileHover } from "./ui";
import { map } from "../../math/index";

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
    public inventory = new Inventory(1000, 100, 100);
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
        const waterCost = 25;
        const sugarCost = 10;
        const targetTile = world.tileAt(action.position.x, action.position.y);
        if (!(targetTile instanceof action.cellType) &&
            this.inventory.water >= waterCost &&
            this.inventory.sugar >= sugarCost) {
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
const height = 50;
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

class World {
    public player: Player = new Player(new Vector2(width / 2, height / 2));
    public grid: Tile[][] = (() => {
        // start with a half water half air
        const grid = new Array(width).fill(undefined).map((_, x) => (
            new Array(height).fill(undefined).map((__, y) => {
                const pos = new Vector2(x, y);
                if (y > height / 2) {
                    // const water = Math.floor(20 + Math.random() * 20);
                    const heightScalar = Math.pow(map(y - height / 2, 0, height / 2, 0.25, 1), 2);
                    const simplexScalar = 0.2;
                    const water = Math.round(Math.max(simplex2(x * simplexScalar, y * simplexScalar), -0.1) * 90 * heightScalar + 10);
                    const soil = new Soil(pos, water);
                    return soil;
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
                    grid[cx][cy] = new Tissue(new Vector2(cx, cy));
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
        DIRECTION_VALUES.forEach((v) => {
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
        const flattenedTiles = ([] as Tile[]).concat(...this.grid);
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
        this.fillCachedEntities();
        this.checkResources();
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

function getMaterial(tile: Tile) {
    // careful - creates a new instance per tile
    return materialMapping.get(tile.constructor as Constructor<Tile>)!.clone();
}

class TileRenderer extends Renderer<Tile> {
    public object = new Object3D();
    public mesh: Mesh;
    static geometry = new PlaneBufferGeometry(1, 1);
    private inventoryRenderer: InventoryRenderer;

    init() {
        this.mesh = new Mesh(
            TileRenderer.geometry,
            getMaterial(this.target),
        );
        this.object.add(this.mesh);

        if (hasInventory(this.target)) {
            this.inventoryRenderer = new InventoryRenderer(this.target.inventory, this.scene);
            this.inventoryRenderer.init();
            this.object.add(this.inventoryRenderer.object);
        }
        this.scene.add(this.object);
    }

    update() {
        this.object.position.set(this.target.pos.x, this.target.pos.y, 0);
        if (hasEnergy(this.target)) {
            this.mesh.material.transparent = true;
            this.mesh.material.opacity = this.target.energy / CELL_ENERGY_MAX;
        }
        if (this.inventoryRenderer != null) {
            this.inventoryRenderer.update();
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

const Mito = new (class extends ISketch {
    public scene = new Scene();
    private camera: THREE.OrthographicCamera;
    public renderers = new Map<Entity, Renderer<Entity>>();
    // when true, automatically create tissue tiles when walking into soil or dirt
    public autoplace: Constructor<Cell> | undefined;
    public elements = [
        <HUD ref={(ref) => this.hudRef = ref! } />,
        <TileHover ref={(ref) => this.hoverRef = ref! } />,
    ];
    public hudRef: HUD;
    public hoverRef: TileHover;
    public mouse = new THREE.Vector2();
    public hoveredTile: Tile;
    private raycaster = new THREE.Raycaster();

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
            console.log(currZoom);
            const newZoom = Math.min(Math.max(currZoom * scalar, 0.1), 2);
            this.camera.zoom = newZoom;
            this.camera.updateProjectionMatrix();
        },
    };

    public init() {
        // this.camera = new OrthographicCamera(0, width, 0, height, -100, 100);
        const aspect = this.aspectRatio;
        this.camera = new OrthographicCamera(0, 0, 0, 0, -100, 100);
        this.resize(this.canvas.width, this.canvas.height);
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
        }
        const oldEntities = Array.from(this.renderers.keys());
        // delete the renderers for entities that have been removed since last render
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
