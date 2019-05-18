import { Scene } from "three";
import { Mito } from "../index";
export abstract class Renderer<T> {
    constructor(public target: T, public scene: Scene, public mito: Mito) { }
    abstract update(): void;
    abstract destroy(): void;
}
