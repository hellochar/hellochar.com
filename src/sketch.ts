export const UI_EVENTS = {
    "click": true,
    "mousedown": true,
    "mouseup": true,
    "mousemove": true,
    "touchstart": true,
    "touchmove": true,
    "touchend": true,
    "keyup": true,
    "keydown": true,
    "keypress": true,
};

export type UIEventReciever = {
    [E in keyof typeof UI_EVENTS]?: JQuery.EventHandler<HTMLElement>;
}

export interface ISketch extends UIEventReciever {
    id: string;

    animate(millisElapsed: number): void;

    init(renderer: THREE.WebGLRenderer, audioContext: SketchAudioContext): void;

    instructions?: string;

    resize?(width: number, height: number): void;

    darkTheme?: boolean;

    elements?: JSX.Element[];

    destroy?(): void;
}

export interface SketchAudioContext extends AudioContext {
    gain: GainNode;
}
