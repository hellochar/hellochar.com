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

    class SSAOPass extends Pass {
        constructor(scene: THREE.Scene, camera: THREE.Camera, width?: number, height?: number);

        uniforms: THREE.Shader["uniforms"];

        radius: number;
        onlyAO: boolean;
        aoClamp: number;
        lumInfluence: number;
    }

    class SAOPass extends Pass {
        static OUTPUT: {
            'Beauty': 1,
            'Default': 0,
            'SAO': 2,
            'Depth': 3,
            'Normal': 4
        };

        constructor(scene: THREE.Scene, camera: THREE.Camera, depthTexture?: boolean, useNormals?: boolean, resolution?: THREE.Vector2);
        params: {
            output: 0 | 1 | 2 | 3 | 4;
            saoBias: number;
            saoIntensity: number;
            saoScale: number
            saoKernelRadius: number
            saoMinResolution: number
            saoBlur: boolean;
            saoBlurRadius: number;
            saoBlurStdDev: number;
            saoBlurDepthCutoff: number;
        }
    }
}
