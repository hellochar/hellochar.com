import { Object3D } from "three";

export interface ComponentClass<T extends Component> {
    new (...args: any[]): T;
    generate(): T;
}

export abstract class Component extends Object3D {
    update(time: number) {
        if (this.updateSelf) {
            this.updateSelf(time);
        }
        // update children
        for (const child of this.children) {
            if (child instanceof Component) {
                child.update(time);
            }
        }
    }

    updateSelf?(time: number): void;
}
