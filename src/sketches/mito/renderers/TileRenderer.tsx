import { ArrowHelper, Audio, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Line, LineBasicMaterial, Material, Mesh, MeshBasicMaterial, Object3D, PlaneBufferGeometry, Scene, Vector2, Vector3 } from "three";
import lazy from "../../../common/lazy";
import { map } from "../../../math/index";
import { blopBuffer, suckWaterBuffer } from "../audio";
import { Constructor } from "../constructor";
import { Air, Cell, DeadCell, Fountain, Fruit, GrowingCell, hasEnergy, hasTilePairs, Leaf, Rock, Root, Soil, Tile, Tissue, Transport, Vein } from "../game/tile";
import { lerp2, Mito } from "../index";
import { hasInventory } from "../inventory";
import { params } from "../params";
import { fruitTexture, textureFromSpritesheet } from "../spritesheet";
import { InventoryRenderer } from "./InventoryRenderer";
import { Renderer } from "./Renderer";

export class TileMesh extends Mesh {
    static geometry = new PlaneBufferGeometry(1, 1);
    constructor(public renderer: TileRenderer) {
        super(TileMesh.geometry, getMaterial(renderer.target) as MeshBasicMaterial);
    }
}

export class TileRenderer<T extends Tile = Tile> extends Renderer<T> {
    // public object = new Object3D();
    public mesh: TileMesh;
    private inventoryRenderer?: InventoryRenderer;
    private originalColor: Color;
    private audio?: Audio;
    private lastAudioValueTracker = 0;
    private pairsLines: Object3D[] = [];
    constructor(target: T, scene: Scene, mito: Mito) {
        super(target, scene, mito);
        if (this.target instanceof GrowingCell) {
            this.growingRenderer = new TileRenderer(this.target.completedCell, this.scene, this.mito);
            this.mesh = this.growingRenderer.mesh;
        } else {
            this.mesh = new TileMesh(this);
        }
        // this.object.name = "TileRenderer Object";

        // if (this.target instanceof Air) {
        //     const colorIndex = map(this.target.co2(), 0.40, 1.001, 0, AIR_COLORSCALE.length - 1);
        //     const startColorIndex = Math.floor(colorIndex);
        //     const startColor = AIR_COLORSCALE[startColorIndex];
        //     this.originalColor = startColor.clone();
        //     if (startColorIndex !== AIR_COLORSCALE.length - 1) {
        //         const alpha = colorIndex - startColorIndex;
        //         const endColorIndex = startColorIndex + 1;
        //         const endColor = AIR_COLORSCALE[endColorIndex];
        //         this.originalColor.lerp(endColor, alpha);
        //     }
        // } else {
        this.originalColor = (this.mesh.material as MeshBasicMaterial).color.clone();
        // }
        // this.object.add(this.mesh);
        if (hasInventory(this.target)) {
            this.inventoryRenderer = new InventoryRenderer(this.target.inventory, this.scene, this.mito);
            this.inventoryRenderer.animationOffset = (this.target.pos.x + this.target.pos.y) / 2;
            // this.mesh.add(this.inventoryRenderer.object);
        }
        this.scene.add(this.mesh);
        const zIndex = this.target instanceof Cell ? 1 : 0;
        this.mesh.position.set(this.target.pos.x, this.target.pos.y, zIndex);
        if (this.target instanceof Cell) {
            // if it takes no turns to build, start it off small just for show
            if (!(this.target.constructor as Constructor<Cell>).turnsToBuild) {
                this.mesh.scale.set(0.01, 0.01, 1);
            }
        } else {
            this.mesh.matrixAutoUpdate = false;
        }
        this.mesh.updateMatrix();
        if (this.target instanceof Leaf || this.target instanceof Root) {
            this.audio = new Audio(this.mito.audioListener);
            this.mesh.add(this.audio);
        }
    }

    steps(x: number, size: number) {
        return Math.floor(x / size) * size;
    }

    private growingRenderer?: TileRenderer;
    update() {
        if (this.target instanceof GrowingCell) {
            // const s = this.steps(1.001 - this.target.timeRemaining / params.cellGestationTurns, 0.05);
            const s = map(1.001 - this.target.timeRemaining / this.target.timeToBuild, 0, 1, 0.2, 1);
            lerp2(this.mesh.scale, {x: s, y: s}, 0.1);
            // this.mesh.scale.x = s;
            // this.mesh.scale.y = s;
        } else {
            lerp2(this.mesh.scale, new Vector2(1, 1), 0.1);
        }
        const lightAmount = this.target.lightAmount();
        const mat = this.mesh.material as MeshBasicMaterial;
        if (this.target instanceof Air) {
            const colorIndex = Math.max(0, map(this.target.co2(), 1 / 6, 1.001, 0, AIR_COLORSCALE.length - 1));
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
        mat.color = new Color(0).lerp(this.originalColor, map(lightAmount, 0, 1, 0.2, 1));
        if (this.target instanceof Cell) {
            this.mesh.position.set(this.target.pos.x, this.target.pos.y + this.target.droopY, 1);
        }
        if (hasEnergy(this.target)) {
            mat.color.lerp(new Color(0), 1 - this.target.energy / params.cellEnergyMax);
        }
        if (this.inventoryRenderer != null) {
            if (lightAmount > 0) {
                // will not render without an update
                this.inventoryRenderer.update();
            }
        }
        if (this.target instanceof Leaf && this.audio != null) {
            const newAudioValueTracker = this.target.didConvert ? 1 : 0;
            if (newAudioValueTracker !== this.lastAudioValueTracker && newAudioValueTracker > 0) {
                this.audio.setBuffer(blopBuffer);
                const dist = this.target.pos.distanceToSquared(this.mito.world.player.pos);
                const volume = Math.min(1, 1 / (1 + dist / 25)) * this.target.sugarConverted * this.target.sugarConverted;
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
            const pairColor = this.target instanceof Leaf ? 0xffc90e : new Color("rgb(9, 12, 255)").getHex();
            const pairs = this.target.tilePairs;
            if (pairs.length !== this.pairsLines.length) {
                // redo pairs
                this.pairsLines.forEach((line) => this.mesh.remove(line));
                this.pairsLines = pairs.map((dir) => {
                    const length = dir.length() * 2 - 0.25;
                    const arrowDir = new Vector3(dir.x, dir.y, 0).normalize();
                    const arrowHelper = this.makeLine(arrowDir, arrowDir.clone().multiplyScalar(-length / 2), length, pairColor);
                    this.mesh.add(arrowHelper);
                    return arrowHelper;
                });
            }
        }
        if (this.hasActiveNeighbors(this.target)) {
            const color = this.target instanceof Root ? new Color("rgb(9, 12, 255)").getHex() : 0xffffff;
            const lines = this.target.activeNeighbors;
            if (lines.length !== this.pairsLines.length) {
                // redo pairs
                this.pairsLines.forEach((line) => this.mesh.remove(line));
                this.pairsLines = lines.map((dir) => {
                    const length = dir.length() - 0.25;
                    const arrowDir = new Vector3(dir.x, dir.y, 0).normalize();
                    const arrowHelper =
                        this.target instanceof Root
                        ? this.makeLine(arrowDir, new Vector3(), length, color)
                        : new ArrowHelper(arrowDir, new Vector3(0, 0, 5), length, color);
                    this.mesh.add(arrowHelper);
                    return arrowHelper;
                });
            }
        }
    }
    hasActiveNeighbors(t: any): t is {
        activeNeighbors: Vector2[];
    } {
        return Array.isArray(t.activeNeighbors);
    }
    static lineGeometry = (() => {
        const g = new BufferGeometry();
        g.addAttribute('position', new Float32BufferAttribute([0, 0, 0, 0, 1, 0], 3));
        return g;
    })();
    private makeLine(dir: Vector3, origin: Vector3, length: number, color: number) {
        // copied from https://github.com/mrdoob/js/blob/master/src/helpers/ArrowHelper.js
        const line = new Line(TileRenderer.lineGeometry, new LineBasicMaterial({ color: color }));
        line.position.copy(origin);
        // dir is assumed to be normalized
        if (dir.y > 0.99999) {
            line.quaternion.set(0, 0, 0, 1);
        } else if (dir.y < -0.99999) {
            line.quaternion.set(1, 0, 0, 0);
        } else {
            const axis = new Vector3(dir.z, 0, -dir.x).normalize();
            const radians = Math.acos(dir.y);
            line.quaternion.setFromAxisAngle(axis, radians);
        }
        line.scale.set(1, Math.max(0, length), 1);
        line.position.z = 0.1;
        line.updateMatrix();
        line.matrixAutoUpdate = false;
        return line;
    }
    destroy() {
        this.scene.remove(this.mesh);
        if (this.inventoryRenderer != null) {
            this.inventoryRenderer.destroy();
        }
    }
}

const materialMapping = lazy(() => {
    const materials = new Map<Constructor<Tile>, Material>();
    materials.set(Air, new MeshBasicMaterial({
        side: DoubleSide,
        depthWrite: false,
    }));
    materials.set(Soil, new MeshBasicMaterial({
        map: textureFromSpritesheet(8, 11),
        // map: textureFromSpritesheet(41, 26),
        // map: textureFromSpritesheet(679 / 16, 438 / 16),
        side: DoubleSide,
        // color: new Color(0xcccccc),
        color: new Color("rgb(112, 89, 44)"),
        depthWrite: false,
    }));
    materials.set(Fountain, new MeshBasicMaterial({
        map: textureFromSpritesheet(56 / 16, 38 / 16),
        side: DoubleSide,
    }));
    materials.set(Rock, new MeshBasicMaterial({
        map: textureFromSpritesheet(26, 20),
        side: DoubleSide,
        color: new Color("rgb(63, 77, 84)"),
    }));
    materials.set(DeadCell, new MeshBasicMaterial({
        map: textureFromSpritesheet(137 / 16, 374 / 16),
        side: DoubleSide,
        color: new Color("rgb(128, 128, 128)"),
    }));
    materials.set(Tissue, new MeshBasicMaterial({
        map: textureFromSpritesheet(6, 31),
        side: DoubleSide,
        color: new Color(0x30ae25),
    }));
    materials.set(Transport, materials.get(Tissue)!);
    // materialMapping.set(Transport, new MeshBasicMaterial({
    //     map: arrowUpMaterial(),
    //     side: DoubleSide,
    //     color: new Color("rgb(42, 138, 25)"),
    // }));
    materials.set(Leaf, new MeshBasicMaterial({
        // map: textureFromSpritesheet(9, 31),
        map: textureFromSpritesheet(55 / 16, 280 / 16),
        // map: textureFromSpritesheet(16, 10),
        side: DoubleSide,
    }));
    materials.set(Root, new MeshBasicMaterial({
        // map: textureFromSpritesheet(0, 31),
        map: textureFromSpritesheet(59 / 16, 327 / 16),
        side: DoubleSide,
    }));
    materials.set(Fruit, new MeshBasicMaterial({
        map: fruitTexture,
        side: DoubleSide,
        transparent: true,
    }));
    materials.set(Vein, new MeshBasicMaterial({
        map: textureFromSpritesheet(Math.floor(184 / 16), Math.floor(152 / 16)),
        side: DoubleSide,
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
    // new Color("hsl(67, 31%, 55%)"),
    new Color("hsl(67, 31%, 25%)"),
    new Color("hsl(180, 31%, 76%)"),
    new Color("hsl(213, 63%, 58%)"),
];
// const AIR_COLORSCALE = [
//     new Color("rgb(146, 215, 255)"),
//     new Color("rgb(53, 125, 210)"),
//     new Color("rgb(56, 117, 154)"),
// ];
