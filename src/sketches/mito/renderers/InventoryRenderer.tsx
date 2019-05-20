import { Color, DoubleSide, PointsMaterial, Scene, Vector2, Vector3 } from "three";

import lazy from "../../../common/lazy";
import { Mito } from "../index";
import { Inventory } from "../inventory";
import { textureFromSpritesheet } from "../spritesheet";
import { Renderer } from "./Renderer";
import { ResourceParticles } from "./resourceParticles";

// we represent Resources as dots of certain colors.
export class InventoryRenderer extends Renderer<Inventory> {
    static WaterParticles = lazy(() => new ResourceParticles(
        {
            color: new Color("rgb(9, 12, 255)"),
            size: 45,
            opacity: 0.75,
        },
        // new PointsMaterial({
        //     // map: textureFromSpritesheet(0, 1),
        //     transparent: true,
        //     opacity: 0.75,
        //     // color: new Color("rgb(12, 41, 255)"),
        //     // color: new Color("rgb(29, 42, 255)"),
        //     color: new Color("rgb(9, 12, 255)"),
        //     size: .12,
        //     side: DoubleSide,
        // })
    ));

    static SugarParticles = lazy(() => new ResourceParticles(
        {
            color: new Color("yellow"),
            size: 45,
            opacity: 0.9,
            map: textureFromSpritesheet(42, 12, "transparent"),
        },
        // new PointsMaterial({
        //     map: textureFromSpritesheet(42, 12, "transparent"),
        //     transparent: true,
        //     opacity: 0.9,
        //     color: "yellow",
        //     size: .12,
        //     side: DoubleSide,
        // })
    ));

    static startFrame() {
        InventoryRenderer.WaterParticles().startFrame();
        InventoryRenderer.SugarParticles().startFrame();
    }

    static endFrame() {
        InventoryRenderer.WaterParticles().endFrame();
        InventoryRenderer.SugarParticles().endFrame();
    }
    // static geometry = new PlaneBufferGeometry(1, 1);
    // static waterMaterial = new MeshBasicMaterial({
    //     // map: textureFromSpritesheet(0, 1),
    //     transparent: true,
    //     opacity: 0.75,
    //     // color: new Color("rgb(12, 41, 255)"),
    //     // color: new Color("rgb(29, 42, 255)"),
    //     color: new Color("rgb(9, 12, 255)"),
    //     side: DoubleSide,
    // });
    // static sugarMaterial = lazy(() => new MeshBasicMaterial({
    //     map: textureFromSpritesheet(42, 12, "transparent"),
    //     transparent: true,
    //     opacity: 0.9,
    //     color: "yellow",
    //     // color: new Color("yellow"),
    //     side: DoubleSide,
    // }));
    public animationOffset = 0;
    // public object = new Object3D();
    public waters: Vector2[] = [];
    public sugars: Vector2[] = [];
    constructor(target: Inventory, public position: Vector2, scene: Scene, mito: Mito) {
        super(target, scene, mito);
        // this.object.name = "InventoryRenderer Object";
        // this.object.position.z = 1;
        // this.object.updateMatrix();
        // this.object.matrixAutoUpdate = false;
        for (let i = 0; i < this.target.water; i++) {
            this.newParticle(this.waters);
        }
        for (let i = 0; i < this.target.sugar; i++) {
            this.newParticle(this.sugars);
        }
    }
    private updateNumParticles(resource: number, resourceArray: Vector2[]) {
        const wantedMeshes = Math.ceil(resource);
        while (resourceArray.length < wantedMeshes) {
            this.newParticle(resourceArray);
        }
        if (resourceArray.length > wantedMeshes) {
            resourceArray.splice(wantedMeshes, resourceArray.length - wantedMeshes);
        }
    }

    private commitParticles(particles: ResourceParticles, resource: number, resourceArray: Vector2[]) {
        if (resourceArray.length > 0) {
            for (let i = 0; i < resourceArray.length - 1; i++) {
                const p = resourceArray[i];
                particles.commit(p.x + this.position.x, p.y + this.position.y, 1, 1);
                resource -= 1;
            }
            const p = resourceArray[resourceArray.length - 1];
            const fract = resource;
            particles.commit(p.x + this.position.x, p.y + this.position.y, 1, fract);
        }
    }

    private simulateResourcePositions() {
        const resources = this.waters.concat(this.sugars);
        for (const r of resources) {
            const vel = r.clone();
            const angle = performance.now() / 3000 + this.animationOffset;
            vel.x += Math.cos(angle) * 0.2;
            // vel.y += Math.sin(performance.now() / 3000) * 0.1;
            const goTowardsCenterStrength = 0.1 + vel.length() * 0.1;
            vel.multiplyScalar(-goTowardsCenterStrength);
            for (const l of resources) {
                if (r === l) {
                    break;
                }
                const offset = r.clone().sub(l);
                const lengthSq = offset.lengthSq();
                if (lengthSq > 0) {
                    const strength = 0.003 / lengthSq;
                    vel.add(offset.multiplyScalar(strength));
                }
            }
            r.add(vel);
        }
    }

    update() {
        this.updateNumParticles(this.target.water, this.waters);
        this.updateNumParticles(this.target.sugar, this.sugars);
        this.simulateResourcePositions();
        this.commitParticles(InventoryRenderer.WaterParticles(), this.target.water, this.waters);
        this.commitParticles(InventoryRenderer.SugarParticles(), this.target.sugar, this.sugars);
    }
    destroy() {
        // no-op
    }
    newParticle(arr: Vector2[]) {
        const position = new Vector2((Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01);
        arr.push(position);
    }
}
