import * as THREE from "three";

import { Component, ComponentClass } from "./component";

export class Whorl<T extends Component> extends Component {
    public constructor(public elements: T[]) {
        super();
        for (const el of elements) {
            this.add(el);
        }
        this.frustumCulled = false;
    }

    static generate<T extends Component>(parameters: WhorlParameters<T>) {
        const elements = whorl(parameters);
        return new Whorl(elements);
    }
}

export interface WhorlParameters<T extends Component> {
    num: number;
    startYRot: number;
    endYRot: number;
    startZRot: number;
    endZRot: number;
    startScale: number;
    endScale: number;
    isBilateral: boolean;
    generate: () => T;
}

export function whorl<T extends Component>(parameters: WhorlParameters<T>) {
    const {
        num,
        startYRot,
        endYRot,
        startZRot,
        endZRot,
        startScale,
        endScale,
        isBilateral,
        generate,
    } = parameters;
    const elements: T[] = [];
    for (let i = 0; i < num; i++) {
        function create(bilat = false) {
            const element = generate();
            let yRot = THREE.Math.mapLinear(i, 0, num, startYRot, endYRot);
            if (bilat) {
                yRot += Math.PI;
            }
            element.rotateY(yRot);

            const zRot = THREE.Math.mapLinear(i, 0, num, startZRot, endZRot);
            // Whorls angle elements close to the Y axis
            element.rotateZ(zRot);

            const scale = THREE.Math.mapLinear(i, 0, num, startScale, endScale);
            element.scale.set(scale, scale, scale);
            return element;
        }
        elements.push(create());
        if (isBilateral) {
            elements.push(create(true));
        }
    }
    return elements;
}
