import { Color, DoubleSide, Mesh, MeshBasicMaterial, Object3D, PlaneBufferGeometry, Scene, Vector3 } from "three";

import lazy from "../../../common/lazy";
import { lerp2, Mito } from "../index";
import { Inventory } from "../inventory";
import { Renderer } from "./Renderer";
import { textureFromSpritesheet } from "../spritesheet";

// we represent Resources as dots of certain colors.
export class InventoryRenderer extends Renderer<Inventory> {
    static geometry = new PlaneBufferGeometry(1, 1);
    static waterMaterial = new MeshBasicMaterial({
        // map: textureFromSpritesheet(0, 1),
        transparent: true,
        opacity: 0.75,
        // color: new Color("rgb(12, 41, 255)"),
        // color: new Color("rgb(29, 42, 255)"),
        color: new Color("rgb(9, 12, 255)"),
        side: DoubleSide,
    });
    static sugarMaterial = lazy(() => new MeshBasicMaterial({
        map: textureFromSpritesheet(42, 12, "transparent"),
        transparent: true,
        opacity: 0.9,
        color: "yellow",
        // color: new Color("yellow"),
        side: DoubleSide,
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
    };
    createWaterMesh() {
        const mesh = new Mesh(InventoryRenderer.geometry, InventoryRenderer.waterMaterial);
        mesh.position.set((Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01, 0);
        this.object.add(mesh);
        this.waters.push(mesh);
    }
    createSugarMesh() {
        const mesh = new Mesh(InventoryRenderer.geometry, InventoryRenderer.sugarMaterial());
        // mesh.position.set(Math.random() - 0.5, Math.random() - 0.5, 0);
        mesh.position.set((Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01, 0);
        this.object.add(mesh);
        this.sugars.push(mesh);
    }
}
