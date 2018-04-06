import * as THREE from "three";

import { map } from "../../math";
import { Component, ComponentClass } from "./component";

export class Whorl<T extends Component> extends Component {
    public object: THREE.Object3D;
    public constructor(public elements: T[]) {
        super();
        this.object = new THREE.Object3D();
        for (const el of elements) {
            if (el.object != null) {
                this.object.add(el.object);
            }
        }
    }

    static generate<T extends Component>(type: ComponentClass<T>, num: number = 5) {
        const elements: T[] = [];
        const numRotations = 1;
        const startScale = 0.9;
        const endScale = 0.9;
        const startZRot = Math.PI / 12;
        const endZRot = Math.PI / 12;
        const isBilateral = false;
        for (let i = 0; i < num; i++) {
            function create(bilateral = false) {
                const element = type.generate();
                if (element.object != null) {
                    let angle = i / num * Math.PI * 2 * numRotations;
                    if (bilateral) {
                        angle += Math.PI;
                    }
                    // Whorls specifically rotate around the Y axis
                    element.object.rotateY(angle);

                    const zRot = map(i, 0, num, startZRot, endZRot);
                    // Whorls angle elements close to the Y axis
                    element.object.rotateZ(zRot);

                    const scale = map(i, 0, num, startScale, endScale);
                    element.object.scale.set(scale, scale, scale);
                }
                elements.push(element);
                return element;
            }
            create();
            if (isBilateral) {
                create(true);
            }
        }
        return new Whorl(elements);
    }
}
