export interface ComponentClass<T extends Component> {
    new (...args: any[]): T;
    generate(): T;
}

export abstract class Component {
    object?: THREE.Object3D;
    update?(time: number): void;
}
