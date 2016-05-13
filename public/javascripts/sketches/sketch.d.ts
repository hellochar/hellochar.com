
interface Sketch {
    animate: (millisElapsed: number) => void;
    id: string;
    init: (renderer: THREE.Renderer, audioContext: AudioContext) => void;
}

interface Window {
    registerSketch(sketch: Sketch): void;
}
