import { ArrowHelper, Object3D, Scene, Vector2, Vector3 } from "three";

import Mito from "..";
import { Root, Transport } from "../game/tile";
import { TileRenderer } from "./TileRenderer";

export class TransportRenderer extends TileRenderer<Transport> {
    private arrow?: Object3D;
    constructor(target: Transport, scene: Scene, mito: Mito) {
        super(target, scene, mito);
        this.arrow = this.makeArrow(this.target.dir);
        this.mesh.add(this.arrow);
    }

    // update() {
    //     super.update();
    //     const from = this.target.getFrom();
    //     if (from == null && this.fromArrow != null) {
    //         this.mesh.remove(this.fromArrow);
    //         this.fromArrow = undefined;
    //     }
    //     if (from != null && this.fromArrow == null) {
    //         this.fromArrow = this.makeArrow(this.target.dir, this.target.dir.clone().multiplyScalar(-1));
    //         this.mesh.add(this.fromArrow);
    //     }

    //     const to = this.target.getTarget();
    //     if (to == null && this.toArrow != null) {
    //         this.mesh.remove(this.toArrow);
    //         this.toArrow = undefined;
    //     }
    //     if (to != null && this.toArrow == null) {
    //         this.toArrow = this.makeArrow(this.target.dir, this.target.dir.clone().multiplyScalar(0));
    //         this.mesh.add(this.toArrow);
    //     }
    // }

    private makeArrow(dir: Vector2) {
        const length = dir.length() - 0.25;
        const arrowDir = new Vector3(dir.x, dir.y, 0).normalize();
        const pos = arrowDir.clone().multiplyScalar(-length / 2);
        return new ArrowHelper(arrowDir, new Vector3(pos.x, pos.y, 1), length, 0xffffff, 0.1, 0.1);
    }
}
