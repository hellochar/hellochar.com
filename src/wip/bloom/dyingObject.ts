import * as THREE from "three";

/**
 * An object that falls to the ground from wherever it is in the scene graph.
 */
export class DyingObject extends THREE.Object3D {
    public velocity = new THREE.Vector3();
    public time = 0;
    constructor(public object: THREE.Object3D) {
        super();
        // clone the world transform of the object
        const transform = object.matrixWorld.decompose(this.position, this.quaternion, this.scale);
        // now, deparent it and add it to this.
        if (object.parent != null) {
            object.parent.remove(object);
            object.position.set(0, 0, 0);
            object.quaternion.setFromEuler(new THREE.Euler(0, 0, 0));
            object.scale.setScalar(1);
            this.add(object);
        }
    }

    update() {
        this.velocity.y -= 0.00005;

        if (this.position.y <= 0.01) {
            this.position.y = 0.01;
            this.velocity.setScalar(0);
        } else {
            this.velocity.x += (Math.random() - 0.5) * 2 * 0.0002;
            this.velocity.z += (Math.random() - 0.5) * 2 * 0.0002;
            this.position.add(this.velocity);

            this.rotateX(0.01);
            this.rotateY(0.02);
            this.rotateZ(0.005);
        }

        if (this.scale.lengthSq() > 0.01 * 0.01) {
            // this.scale.multiplyScalar(0.99);
            // this.scale.setScalar(1 - this.time / 200);
        } else {
            this.visible = false;
            this.object.visible = false;
            this.parent.remove(this);
        }
    }
}
