import * as THREE from "three";

// changes in r88

declare module 'THREE' {
    export type AxesHelper = THREE.AxisHelper;
    var AxesHelper: AxesHelper;
}