import { Object3D } from "three";

export interface ComponentClass<T extends Component> {
    new (...args: any[]): T;
    generate(): T;
}

export abstract class Component extends Object3D {
    public timeBorn!: number;
    public currentTime: number = 0;

    constructor() {
        super();
        // this.addEventListener("added", this.handleOnAdded);
    }

    // private handleOnAdded = () => {
    //     // walk up the tree until you hit a Component
    //     let nearestComponentAncestor = this.parent;
    //     while (!(nearestComponentAncestor instanceof Component) && nearestComponentAncestor != null) {
    //         nearestComponentAncestor = nearestComponentAncestor.parent;
    //     }
    //     if (nearestComponentAncestor != null) {

    //     }
    // };

    // update(time: number) {
    //     this.currentTime = time;
    //     if (this.updateSelf) {
    //         this.updateSelf(time);
    //     }
    //     // update children
    //     for (const child of this.children) {
    //         if (child instanceof Component) {
    //             child.update(time);
    //         }
    //     }

    // add(...objs: Object3D[]) {
    //     super.add(...objs);
    //     for (const obj of objs) {
    //         if (obj instanceof Component) {
    //             obj.timeBorn = this.currentTime;
    //         }
    //     }
    // }

    updateSelf?(time: number): void;
}
