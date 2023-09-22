import { Color, DoubleSide, Mesh, MeshBasicMaterial, PlaneBufferGeometry, Scene } from "three";

import devlog from "../../../common/devlog";
import { ActionMove } from "../action";
import { Player } from "../game";
import { lerp2, Mito } from "../index";
import { ACTION_KEYMAP, MOVEMENT_KEYS } from "../keymap";
import { MOVEMENT_KEY_MESHES } from "../movementKeyMeshes";
import { textureFromSpritesheet } from "../spritesheet";
import { Renderer } from "./Renderer";

export class PlayerRenderer extends Renderer<Player> {
    public mesh: Mesh;
    constructor(target: Player, scene: Scene, mito: Mito) {
        super(target, scene, mito);
        this.mesh = new Mesh(new PlaneBufferGeometry(1, 1),
            // new THREE.CircleBufferGeometry(0.5, 20),
            new MeshBasicMaterial({
                transparent: true,
                depthWrite: false,
                depthTest: false,
                map: textureFromSpritesheet(29, 12, "transparent"),
                color: new Color("white"),
                side: DoubleSide,
            }));
        devlog("created player renderer");
        lerp2(this.mesh.position, this.target.pos, 1);
        this.mesh.position.z = 2;
        this.scene.add(this.mesh);
    }
    update() {
        lerp2(this.mesh.position, this.target.droopPos(), 0.5);
        // lerp2(this.mesh.position, this.target.droopPos(), 1.0);
        this.mesh.position.z = 2;
        for (const [key, keyMesh] of MOVEMENT_KEY_MESHES) {
            const action = MOVEMENT_KEYS[key];
            const x = this.target.pos.x + action.dir.x;
            const y = this.target.pos.y + action.dir.y;
            if (this.target.isBuildCandidate(this.mito.world.tileAt(x, y)) && this.mito.uiState.type === "main") {
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
