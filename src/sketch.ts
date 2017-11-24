import * as $ from "jquery";
import * as THREE from "three";

const $window = $(window);
var HAS_SOUND = true;

function setCanvasDimensions(renderer: THREE.WebGLRenderer, sketchParent: Element) {
    renderer.setSize(sketchParent.clientWidth, sketchParent.clientHeight);
}

const DEFAULT_SKETCH_OPTIONS: ISketchOptions = {
    showInstructions: true
};

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
}

export interface SketchAudioContext extends AudioContext {
    gain: GainNode;
}

/**
 *
 * Initializes the sketch object passed to it.
 *
 * @param sketch
 * @param sketchParent: element to place the sketch on.
 * @param options: 
 * 
 */
export function initializeSketch(sketch: ISketch, sketchParent: Element, options: ISketchOptions = DEFAULT_SKETCH_OPTIONS) {
    let renderer: THREE.WebGLRenderer;
    try {
        renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true, antialias: true });
    } catch (e) {
        throw new Error("WebGL error");
    }

    sketchParent.appendChild(renderer.domElement);
    // document.body.appendChild(renderer.domElement);

    setCanvasDimensions(renderer, sketchParent);
    $window.resize(function() {
        setCanvasDimensions(renderer, sketchParent);
        if (sketch.resize != null) {
            sketch.resize(renderer.domElement.width, renderer.domElement.height);
        }
    });

    // canvas setup
    var $canvas = $(renderer.domElement);
    $canvas.attr("tabindex", 1);
    Object.keys(UI_EVENTS).forEach((eventName: keyof typeof UI_EVENTS) => {
        const callback = sketch[eventName];
        if (callback != null) {
            $canvas.on(eventName, callback);
        }
    });
    // prevent scrolling the viewport
    $canvas.on("touchmove", function(event) {
        event.preventDefault();
    });

    let lastTimestamp = 0;
    // initialize and run sketch
    function animateAndRequestAnimFrame(timestamp: number) {
        var millisElapsed = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        // if (isElementOnScreen(sketchParent)) {
        //     $sketchElement.removeClass("disabled");
        //     $canvas.focus();
        //     if (HAS_SOUND) {
        //         audioContextGain.gain.value = 1;
        //     }
        sketch.animate(millisElapsed);
        // } else {
        //     $sketchElement.addClass("disabled");
        //     $canvas.blur();
        //     audioContextGain.gain.value = 0;
        // }
        requestAnimationFrame(animateAndRequestAnimFrame);
    }

    const audioContext = new AudioContext() as SketchAudioContext;
    var audioContextGain = audioContext.createGain();
    audioContextGain.connect(audioContext.destination);
    audioContext.gain = audioContextGain;
    if (!HAS_SOUND) {
        audioContextGain.gain.value = 0;
    }
    document.addEventListener("visibilitychange", function() {
        if (document.hidden) {
            audioContextGain.gain.value = 0;
        }
    });

    sketch.init(renderer, audioContext);
    requestAnimationFrame(animateAndRequestAnimFrame);

}

export interface ISketchOptions {
    showInstructions?: boolean;
}