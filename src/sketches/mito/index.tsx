import * as React from "react";
import * as THREE from "three";
import { Color, Material, Mesh, MeshBasicMaterial, Object3D, OrthographicCamera, PlaneBufferGeometry, Scene, Vector2, Vector3 } from "three";

import devlog from "../../common/devlog";
import lazy from "../../common/lazy";
import { map } from "../../math/index";
import { ISketch } from "../../sketch";
import { Action, ActionBuild, ActionBuildTransport, ActionMove, ActionStill } from "./action";
import { blopBuffer, drums, hookUpAudio, strings, suckWaterBuffer } from "./audio";
import { Constructor } from "./constructor";
import { Player, World } from "./game";
import { Air, Cell, DeadCell, Fountain, Fruit, hasEnergy, hasTilePairs, Leaf, Rock, Root, Soil, Tile, Tissue, Transport } from "./game/tile";
import { hasInventory, Inventory } from "./inventory";
import { ACTION_KEYMAP, BUILD_HOTKEYS } from "./keymap";
import { MOVEMENT_KEY_MESHES } from "./movementKeyMeshes";
import { params } from "./params";
import { directionFor, findPath } from "./pathfinding";
import { fruitTexture, textureFromSpritesheet } from "./spritesheet";
import { NewPlayerTutorial } from "./tutorial";
import TileHighlight from "./tutorial/tileHighlight";
import { GameStack, HUD, ParamsGUI, TileHover } from "./ui";

export type Entity = Tile | Player;

interface Steppable {
    step(): void;
}

export function isSteppable(obj: any): obj is Steppable {
    return typeof obj.step === "function";
}
export const width = 50;
export const height = 100;

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

        for (const [key, keyMesh] of MOVEMENT_KEY_MESHES) {
            const action = ACTION_KEYMAP[key] as ActionMove;
            const x = this.target.pos.x + action.dir.x;
            const y = this.target.pos.y + action.dir.y;

            if (this.target.isBuildCandidate(action) && this.mito.uiState.type === "main") {
                this.scene.add(keyMesh);
                keyMesh.position.x = x;
                keyMesh.position.y = y;
                keyMesh.position.z = 2;
            } else {
                this.scene.remove(keyMesh);
            }
        }

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
            mat.color.lerp(new THREE.Color(0), 1 - this.target.energy / params.cellEnergyMax);
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
        if (this.hasActiveNeighbors(this.target)) {
            const color = InventoryRenderer.waterMaterial.color.getHex();
            const lines = this.target.activeNeighbors;
            if (lines.length !== this.pairsLines.length) {
                // redo pairs
                this.pairsLines.forEach((line) => this.object.remove(line));
                this.pairsLines = lines.map((dir) => {
                    const length = dir.length() - 0.25;
                    const arrowDir = new THREE.Vector3(dir.x, dir.y, 0).normalize();
                    const arrowHelper = this.makeLine(arrowDir, new THREE.Vector3(), length, color);
                    arrowHelper.position.z = 0.1;
                    this.object.add(arrowHelper);
                    return arrowHelper;
                });
            }
        }
    }

    hasActiveNeighbors(t: any): t is { activeNeighbors: Vector2[] } {
        return Array.isArray(t.activeNeighbors);
    }

    static lineGeometry = (() => {
        const g = new THREE.BufferGeometry();
        g.addAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 1, 0], 3));
        return g;
    })();

    private makeLine(dir: Vector3, origin: Vector3, length: number, color: number) {
        // copied from https://github.com/mrdoob/three.js/blob/master/src/helpers/ArrowHelper.js
        const line = new THREE.Line(TileRenderer.lineGeometry, new THREE.LineBasicMaterial({ color: color }));
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
        color: "yellow",
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
            this.createSugarMesh();
        }

        // don't add to scene yourself
    }

    private updateMeshes(resourceType: "water" | "sugar", resource: number, array: Mesh[], create: () => void) {
        const wantedMeshes = Math.ceil(resource);
        while (array.length < wantedMeshes) {
            create();
        }
        while (array.length > wantedMeshes) {
            const mesh = array.shift()!;
            this.object.remove(mesh);
        }
        const s = InventoryRenderer.resourceMeshScale[resourceType];
        for (const mesh of array) {
            mesh.scale.set(s, s, 1);
        }
        const fract = resource - Math.floor(resource);
        if (array.length > 0 && fract > 0) {
            const scale = s * fract;
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
        this.updateMeshes("water", this.target.water, this.waters, () => this.createWaterMesh());
        this.updateMeshes("sugar", this.target.sugar, this.sugars, () => this.createSugarMesh());
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

    static resourceMeshScale = {
        water: .12,
        sugar: .12,
    }

    createWaterMesh() {
        const mesh = new Mesh(
            InventoryRenderer.geometry,
            InventoryRenderer.waterMaterial,
        );
        mesh.position.set((Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01, 0);
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

export type GameState = "main" | "win" | "lose" | "instructions";

export interface UIStateMain {
    type: "main";
}
export interface UIStateExpanding {
    type: "expanding";
    originalAction: Action;
    originalZoom: number;
    target: THREE.Vector2;
}
export type UIState = UIStateMain | UIStateExpanding;

class Mito extends ISketch {
    public readonly world = new World();
    public scene = new Scene();
    private camera = new OrthographicCamera(0, 0, 0, 0, -100, 100);
    public renderers = new Map<Entity, Renderer<Entity>>();
    // when true, automatically create tissue tiles when walking into soil or dirt
    public autoplace: Constructor<Cell> | undefined;
    public render() {
        return <>
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
                this.tryAction(key, false);
            }}
            world={this.world}
        />
        <TileHover ref={(ref) => this.hoverRef = ref } />
        <GameStack ref={(ref) => this.gameStackRef = ref } mito={this} />
        {/* <NewPlayerTutorial ref={(ref) => this.tutorialRef = ref } mito={this} />, */}
        <ParamsGUI />
        { this.hoveredTile ? <TileHighlight x={this.hoveredTile.pos.x} y={this.hoveredTile.pos.y} scene={this.scene} /> : null }
        </>;
    }
    public hudRef: HUD | null = null;
    public hoverRef: TileHover | null = null;
    public gameStackRef: GameStack | null = null;
    public tutorialRef: NewPlayerTutorial | null = null;
    public mouse = new THREE.Vector2();
    public hoveredTile?: Tile;
    private raycaster = new THREE.Raycaster();
    public gameState: GameState = "instructions";
    public audioListener = new THREE.AudioListener();
    private keyMap = new Set<string>();
    public uiState: UIState = { type: "main" };

    private enterUIStateExpanding(move: ActionMove) {
        const target = this.world.player.pos.clone().add(move.dir);
        const originalZoom = this.uiState.type === "main" ? this.camera.zoom : this.uiState.originalZoom;
        this.uiState = {
            type: "expanding",
            originalAction: move,
            originalZoom,
            target,
        };
        if (this.hudRef) {
            this.hudRef.setState({ uiState: this.uiState });
        }
    }

    private resetUIState() {
        if (this.uiState.type === "expanding") {
            this.camera.zoom = this.uiState.originalZoom;
            this.camera.updateProjectionMatrix();
            this.uiState = { type: "main" };
            if (this.hudRef) {
                this.hudRef.setState({ uiState: this.uiState });
            }
        }
    }

    public events = {
        contextmenu: (event: JQuery.Event) => {
            if (this.uiState.type === "main") {
                const tile = this.getTileAtScreenPosition(event.clientX!, event.clientY!);
                if (tile != null) {
                    this.world.player.setAction({
                        type: "deconstruct",
                        position: tile.pos,
                    });
                }
            }
            return false;
        },
        mousemove: (event: JQuery.Event) => {
            this.mouse.x = event.clientX!;
            this.mouse.y = event.clientY!;
        },
        click: (event: JQuery.Event) => {
            // left-click
            const isBuildAttempt = (() => {
                const { player } = this.world;
                // try build
                const tile = this.getTileAtScreenPosition(event.clientX!, event.clientY!);
                if (tile) {
                    const direction = directionFor(player.pos.x, player.pos.y, tile.pos.x, tile.pos.y);
                    if (direction) {
                        const move: ActionMove = {
                            type: "move",
                            dir: direction,
                        };
                        const isBuildCandidate = this.world.player.isBuildCandidate(move);
                        if (isBuildCandidate) {
                            this.enterUIStateExpanding(move);
                            return true;
                        }
                    }
                }
            })();
            if (!isBuildAttempt) {
                this.resetUIState();
                this.enqueuePlayerMoveToMouse(event.clientX!, event.clientY!);
            }
        },
        keydown: (event: JQuery.Event) => {
            const key = event.key!;
            const isRepeatedStroke = this.keyMap.has(key);
            this.keyMap.add(key);
            this.tryAction(key, isRepeatedStroke);
        },
        keyup: (event: JQuery.Event) => {
            this.keyMap.delete(event.key!);
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

    tryAction(key: string, isRepeatedStroke: boolean) {
        const { world } = this;
        if (key === "?") {
            this.gameState = (this.gameState === "instructions" ? "main" : "instructions");
            return;
        }
        if (this.uiState.type === "expanding") {
            if (key === "Escape") {
                this.resetUIState();
                return;
            }
            if (key in BUILD_HOTKEYS && !(BUILD_HOTKEYS[key] === Fruit && this.world.fruit != null)) {
                const cellType = BUILD_HOTKEYS[key];
                const buildAction: ActionBuild = {
                    type: "build",
                    cellType: cellType,
                    position: this.uiState.target,
                };
                this.world.player.setAction(buildAction);
                this.resetUIState();
                return;
            } else if (ACTION_KEYMAP[key] && ACTION_KEYMAP[key] !== this.uiState.originalAction) {
                this.resetUIState();
                return;
            }
        }
        if (this.gameState === "instructions") {
            if (key === "Escape") {
                this.gameState = "main";
            }
            // block further actions
            return;
        }
        if (this.autoplace != null && key === "Escape") {
            this.autoplace = undefined;
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
                    this.world.player.setAction(buildTransportAction);
                } else if (!world.player.verifyMove(action) && !isRepeatedStroke) {
                    const buildAction: ActionBuild = {
                        type: "build",
                        cellType: this.autoplace,
                        position: this.world.player.pos.clone().add(action.dir),
                    };
                    this.world.player.setAction(buildAction);
                    if (this.autoplace !== Tissue) {
                        this.autoplace = undefined;
                    }
                } else {
                    this.world.player.setAction(action);
                    // this.autoplace = undefined;
                }
            } else if (this.autoplace == null && action.type === "move" && this.world.player.isBuildCandidate(action)) {
                // we attempt to move into a place we cannot
                this.enterUIStateExpanding(action);
            } else {
                this.world.player.setAction(action);
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

    private expandingTileHighlight = (() => {
        const mesh = new THREE.Mesh(
            TileRenderer.geometry,
            new THREE.MeshBasicMaterial({
                color: "white",
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.5,
            }),
        );
        return mesh;
    })();

    public init() {
        hookUpAudio(this.audioContext);
        this.camera.zoom = 1.5;
        this.camera.add(this.audioListener);

        this.resize(this.canvas.width, this.canvas.height);
        // darkness and water diffuse a few times to stabilize it
        for (let i = 0; i < 5; i++) {
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
        const yPos = this.world.player.pos.y;
        const drumVolume = map(yPos, height / 2, height, 0, 0.5);
        const stringsVolume = map(yPos, height / 2, 0, 0, 0.5);
        drums.gain.gain.value = Math.max(0, drumVolume);
        strings.gain.gain.value = Math.max(0, stringsVolume);
    }

    public logRenderInfo() {
        devlog(
`Geometries in memory: ${this.renderer.info.memory.geometries}
Textures in memory: ${this.renderer.info.memory.textures}
# Render Calls: ${this.renderer.info.render.calls}
# Render Lines: ${this.renderer.info.render.lines}
# Render Points: ${this.renderer.info.render.points}
# Render Tris: ${this.renderer.info.render.triangles}
`,
        );
    }

    public worldStepAndUpdateRenderers() {
        this.world.step();
        if (this.tutorialRef) {
            this.tutorialRef.setState({ time: this.world.time });
        }
        this.gameState = this.world.checkWinLoss() || this.gameState;

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

    private getCameraNormCoordinates(clientX: number, clientY: number) {
        return new THREE.Vector2(
            clientX / this.canvas.width * 2 - 1,
            -clientY / this.canvas.height * 2 + 1,
        );
    }

    private getTileAtScreenPosition(clientX: number, clientY: number) {
        const cameraNorm = this.getCameraNormCoordinates(clientX, clientY);
        this.raycaster.setFromCamera(cameraNorm, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        const i = intersects[0];
        if (i != null) {
            const {x, y} = i.point;
            const ix = Math.round(x);
            const iy = Math.round(y);
            const tile = this.world.tileAt(ix, iy);
            if (tile != null && tile.lightAmount() > 0) {
                return tile;
            }
        }
    }

    public animate() {
        const { world } = this;
        if (document.activeElement !== this.canvas) {
            this.canvas.focus();
        }
        if (this.gameState === "main") {
            if (params.isRealtime) {
                if (this.frameCount % 3 === 0) {
                    this.worldStepAndUpdateRenderers();
                }
            } else if (world.player.getAction() != null) {
                this.worldStepAndUpdateRenderers();
            }
            // this.world.entities().forEach((entity) => {
            this.world.renderableEntities().forEach((entity) => {
                const renderer = this.getOrCreateRenderer(entity);
                renderer.update();
            });
        }
        const mouseNorm = this.getCameraNormCoordinates(this.mouse.x, this.mouse.y);
        if (this.uiState.type === "main") {
            this.scene.remove(this.expandingTileHighlight);
            const target = new THREE.Vector2(
                this.world.player.pos.x + mouseNorm.x / 2,
                this.world.player.pos.y - mouseNorm.y / 2,
            );
            lerp2(this.camera.position, target, 0.3);
        } else {
            this.scene.add(this.expandingTileHighlight);
            this.expandingTileHighlight.position.set(
                this.uiState.target.x,
                this.uiState.target.y,
                1,
            );
            const target = new THREE.Vector2(
                this.uiState.target.x,
                this.uiState.target.y,
            );
            lerp2(this.camera.position, target, 0.3);
        }
        this.renderer.render(this.scene, this.camera);

        if (this.hoverRef != null) {
            this.hoveredTile = this.getTileAtScreenPosition(this.mouse.x, this.mouse.y);
            this.hoverRef.setState({
                tile: this.hoveredTile,
            });
        }

        if (this.hudRef != null) {
            const isTutorialFinished = this.tutorialRef == null ? true : this.tutorialRef.isFinished();
            this.hudRef.setState({
                isTutorialFinished,
                sugar: this.world.player.inventory.sugar,
                water: this.world.player.inventory.water,
            });
        }
        if (this.gameStackRef != null) {
            this.gameStackRef.setState({
                state: this.gameState,
            });
        }
        // this.logRenderInfo();
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

    public enqueuePlayerMoveToMouse(clientX: number, clientY: number) {
        const target = this.getTileAtScreenPosition(clientX, clientY);
        if (target) {
            const path = findPath(this.world, target.pos, true);
            const actions = path.map((dir) => ({
                type: "move",
                dir,
            }) as ActionMove);
            this.world.player.setActions(actions);
        }
    }
}

export default Mito;
