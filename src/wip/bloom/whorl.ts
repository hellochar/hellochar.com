import * as THREE from "three";

import { map } from "../../math";
import { Component, ComponentClass } from "./component";

export class Whorl<T extends Component> extends Component {
    public constructor(public elements: T[]) {
        super();
        for (const el of elements) {
            this.add(el);
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
                let angle = i / num * Math.PI * 2 * numRotations;
                if (bilateral) {
                    angle += Math.PI;
                }
                // Whorls specifically rotate around the Y axis
                element.rotateY(angle);

                const zRot = map(i, 0, num, startZRot, endZRot);
                // Whorls angle elements close to the Y axis
                element.rotateZ(zRot);

                const scale = map(i, 0, num, startScale, endScale);
                element.scale.set(scale, scale, scale);
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
