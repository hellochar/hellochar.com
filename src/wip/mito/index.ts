import * as React from "react";
import { Geometry, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, PlaneBufferGeometry, Scene, ShaderMaterial, SphereBufferGeometry, SphereGeometry, Vector2, Vector3, Color, Material } from "three";

import { ISketch, SketchAudioContext } from "../../sketch";
import * as THREE from "three";

const CELL_ENERGY_MAX = 100;

class Inventory {
    constructor(
        public max: number,
        public water: number = 0,
        public sugar: number = 0,
    ) {
    }

    public give(other: Inventory, amountWater: number, amountSugar: number) {
        // to check:
        // 1) we have enough water and sugar
        //      if we don't, cap water and sugar to the amount available
        // 2) other has enough space
        //      if it doesn't, scale down to the amount that is available
        let water = Math.max(amountWater, this.water);
        let sugar = Math.max(amountSugar, this.sugar);
        const capacityNeeded = water + sugar;
        if (capacityNeeded > other.capacity()) {
            const capacity = other.capacity();
            // scale down the amount to give
            water = Math.round(water / capacityNeeded * capacity);
            sugar = Math.round(sugar / capacityNeeded * capacity);
        }
        this.change(-water, -sugar);
        other.change(water, sugar);
    }

    public change(water: number, sugar: number) {
        this.water += water;
        this.sugar += sugar;
        this.validate();
    }

    public capacity() {
        const { max, water, sugar } = this;
        return max - water - sugar;
    }

    validate() {
        const { max, water, sugar } = this;
        if (water < 0) {
            throw new Error(`water < 0: ${water}`);
        }
        if (sugar < 0) {
            throw new Error(`sugar < 0: ${sugar}`);
        }
        if (water + sugar > max) {
            throw new Error(`bad inventory: ${water} water + ${sugar} > ${max} max`);
        }
    }
}

interface Steppable {
    step(): void;
}

function isSteppable(obj: any): obj is Steppable {
    return typeof obj.step === "function";
}

abstract class Tile {
    public constructor(public pos: Vector2) {}
}

class Air extends Tile {
    public co2() {
        return 1;
    }

    public sunlight() {
        return 1;
    }
}

class Soil extends Tile {
    public inventory = new Inventory(100);
    constructor(pos: Vector2, water: number) {
        super(pos);
        this.inventory.change(water, 0);
    }
}

class Cell extends Tile {
    public energy: number = CELL_ENERGY_MAX;
}

class Tissue extends Cell {
    public inventory = new Inventory(100);
}

class Leaf extends Cell {
    public step() {

    }
}

class Root extends Cell {
    public step() {
        // const neighbors = World.tileNeighbors(this.pos);
        // for (const [dir, tile] of neighbors.entries()) {

        // }
    }
}

interface ActionMove {
    type: "move";
    dir: Vector2;
}
type Action = ActionMove;

class Player {
    public inventory = new Inventory(1000, 100, 100);
    public action?: Action;
    public constructor(public pos: Vector2) {}

    public step() {
        if (this.action === undefined) {
            throw new Error("tried stepping player before action was filled in!");
        }
        this.attemptDo(this.action);
        this.action = undefined;
    }

    public attemptDo(action: Action) {
        switch (action.type) {
            case "move":
                this.attemptMove(action);
        }
    }

    public attemptMove(action: ActionMove) {
        const target = this.pos.clone().add(action.dir);
        const targetTile = world.tileAt(target.x, target.y);
        if (!(targetTile instanceof Tissue)) {
            // can't move!
        } else {
            // do the move
            this.pos = world.wrappedPosition(target);
        }
    }
}

type Entity = Tile | Player;

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
                    const water = Math.random() * 10;
                    const soil = new Soil(pos, water);
                    return soil;
                } else {
                    return new Air(pos);
                }
            })
        ));

        // add a "seed" of tissue around the player
        const radius = 5;
        for (let x = -radius; x <= radius; x++) {
            for (let y = -radius; y <= radius; y++) {
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
    }
}

const world = new World();

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

interface TileConstructor {
    new(...args: any[]): Tile;
}

const materialMapping = new Map<TileConstructor, Material>();
materialMapping.set(Air, new MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: new Color("lightblue"),
}));
materialMapping.set(Soil, new MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: new Color("brown"),
}));
materialMapping.set(Tissue, new MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: new Color("darkgreen"),
}));

function getMaterial(tile: Tile) {
    return materialMapping.get(tile.constructor as TileConstructor);
}

class TileRenderer extends Renderer<Tile> {
    public mesh: Mesh;
    static geometry = new PlaneBufferGeometry(1, 1);

    init() {
        this.mesh = new Mesh(
            TileRenderer.geometry,
            getMaterial(this.target),
        );
        this.scene.add(this.mesh);
    }

    update() {
        this.mesh.position.set(this.target.pos.x, this.target.pos.y, 0);
    }

    destroy() {
        this.scene.remove(this.mesh);
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

const ACTION_KEYMAP: { [key: string]: ActionMove } = {
    w: {
        type: "move",
        dir: DIRECTIONS.n,
    },
    a: {
        type: "move",
        dir: DIRECTIONS.w,
    },
    s: {
        type: "move",
        dir: DIRECTIONS.s,
    },
    d: {
        type: "move",
        dir: DIRECTIONS.e,
    },
    q: {
        type: "move",
        dir: DIRECTIONS.nw,
    },
    e: {
        type: "move",
        dir: DIRECTIONS.ne,
    },
    z: {
        type: "move",
        dir: DIRECTIONS.sw,
    },
    c: {
        type: "move",
        dir: DIRECTIONS.se,
    },
};

const Mito = new (class extends ISketch {
    public scene = new Scene();
    private camera: THREE.OrthographicCamera;
    public renderers = new Map<Entity, Renderer<Entity>>();

    public events = {
        keypress: (event: JQuery.Event) => {
            console.log(event);
            const key = event.key!;
            const action = ACTION_KEYMAP[key];
            if (action != null) {
                world.player.action = action;
            }
        },
    };

    public init() {
        this.camera = new OrthographicCamera(0, width, 0, height, -100, 100);
        this.camera.position.z = 1;
        this.camera.lookAt(new Vector3(0, 0, 0));
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
        this.renderer.render(this.scene, this.camera);
    }
})();

export default Mito;
