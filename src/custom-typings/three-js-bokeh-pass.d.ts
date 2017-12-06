import * as THREE from "three";

declare module 'THREE' {
    class Pass {
        enabled: boolean;
        needsSwap: boolean;
        clear: boolean;
        renderToScreen: boolean;

        setSize(width: number, height: number): void;

        render(renderer: THREE.Renderer, writeBuffer: any, readBuffer: any, delta: number, maskActive: boolean): void;
    }

    interface BokehPassParameters {
        aspect?: number;
        /**
         * Focus distance.
         */
        focus?: number;
        /**
         * Camera aperture scale. Bigger values for shallower depth of field.
         */
        aperture?: number;
        /**
         * Maximum blur strength.
         */
        maxblur?: number;
        width?: number;
        height?: number;
    }

    const BokehShader: THREE.Shader;
    class BokehPass extends Pass {
        constructor(scene: THREE.Scene, camera: THREE.Camera, options?: BokehPassParameters);
        uniforms: THREE.Shader["uniforms"];
    }
}