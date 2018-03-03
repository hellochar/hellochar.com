import * as React from "react";
import * as THREE from "three";

export abstract class ISketch {
    public renderer: THREE.WebGLRenderer;
    public audioContext: SketchAudioContext;
    public id?: string;
    public elements?: JSX.Element[];
    public canvasProps: React.DetailedHTMLProps<React.CanvasHTMLAttributes<HTMLCanvasElement>, HTMLCanvasElement>;
    /**
     * milliseconds since sketch started running.
     */
    public timeElapsed: number;

    setup(renderer: THREE.WebGLRenderer, audioContext: SketchAudioContext) {
        this.renderer = renderer;
        this.audioContext = audioContext;
    }

    get aspectRatio() {
        return this.renderer.domElement.height / this.renderer.domElement.width;
    }

    get resolution() {
        return new THREE.Vector2(this.renderer.domElement.width, this.renderer.domElement.height);
    }

    get canvas() {
        return this.renderer.domElement;
    }

    abstract init(): void;

    abstract animate(millisElapsed: number): void;

    resize?(width: number, height: number): void;

    destroy?(): void;
}

export interface SketchAudioContext extends AudioContext {
    gain: GainNode;
}
