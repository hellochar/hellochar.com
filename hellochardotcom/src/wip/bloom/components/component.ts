import { Object3D } from "three";

export interface ComponentClass<T extends Component> {
    new (...args: any[]): T;
    generate(): T;
}

// even more generic than Component - also includes individual branch Bones
export interface Biological {
    feed(time: number, nutrients: number): void;
}

export abstract class Component extends Object3D implements Biological {
    public timeBorn!: number;

    constructor() {
        super();
    }

    updateSelf?(time: number): void;

    feed(time: number, nutrients: number) {
        // TODO fill this in properly
    }
}
