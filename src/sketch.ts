import * as $ from "jquery";
import * as THREE from "three";

const $window = $(window);
var HAS_SOUND = true;

function isElementOnScreen(element: JQuery) {
    var scrollTop = $window.scrollTop()!,
        scrollBottom = scrollTop + $window.height()!;

    var elementTop = element.offset()!.top;
    var elementBottom = elementTop + element.height()!;
    var elementMiddle = (elementBottom + elementTop) / 2;

    return scrollTop < elementMiddle && elementMiddle < scrollBottom;
}

function setCanvasDimensions(renderer: THREE.WebGLRenderer, sketchElement: JQuery) {
    renderer.setSize(sketchElement.width()!, sketchElement.height()!);
}

const DEFAULT_SKETCH_OPTIONS: ISketchOptions = {
    showInstructions: true
};

export type IEventCallback<T> = (event: JQueryEventObject) => void;

export interface ISketch {
    animate(millisElapsed: number): void;
    id: string;
    init(renderer: THREE.WebGLRenderer, audioContext: SketchAudioContext): void;
    instructions?: string;

    mousedown?: IEventCallback<MouseEvent>;
    mouseup?: IEventCallback<MouseEvent>;
    mousemove?: IEventCallback<MouseEvent>;

    touchstart?: IEventCallback<TouchEvent>;
    touchmove?: IEventCallback<TouchEvent>;
    touchend?: IEventCallback<TouchEvent>;

    resize(width: number, height: number): void;
}

export interface SketchAudioContext extends AudioContext {
    gain: GainNode;
}

/**
 *
 * Initializes the sketch object passed to it.
 *
 * @param sketch
 * @param $sketchParent: JQuery element to place the sketch on.
 * @param options: 
 * 
 */
export function initializeSketch(sketch: ISketch, $sketchParent: JQuery, options: ISketchOptions = DEFAULT_SKETCH_OPTIONS) {
    var renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true, antialias: true });

    // add sketch element to body
    var $sketchElement = $('<div></div>').addClass("sketch-wrapper").attr('id', sketch.id);
    $sketchParent.append($sketchElement);

    // allow canvas to be selectable
    $sketchElement.append(renderer.domElement);

    var $instructionsElement = $("<div>").addClass("instructions").text(sketch.instructions!);
    if (options.showInstructions) {
        $sketchElement.append($instructionsElement);
    }

    setCanvasDimensions(renderer, $sketchElement);
    $window.resize(function() {
        setCanvasDimensions(renderer, $sketchElement);
        if (sketch.resize != null) {
            sketch.resize(renderer.domElement.width, renderer.domElement.height);
        }
    });

    // canvas setup
    var $canvas = $(renderer.domElement);
    $canvas.attr("tabindex", 1);
    $canvas.one("mousedown touchstart", function (e) {
        $instructionsElement.addClass("interacted");
    });
    ["mousedown", "mouseup", "mousemove", "touchstart", "touchmove", "touchend", "keyup", "keydown", "keypress"].forEach(function (eventName) {
        var callback = sketch[eventName];
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
        if (isElementOnScreen($sketchElement)) {
            $sketchElement.removeClass("disabled");
            $canvas.focus();
            if (HAS_SOUND) {
                audioContextGain.gain.value = 1;
            }
            sketch.animate(millisElapsed);
        } else {
            $sketchElement.addClass("disabled");
            $canvas.blur();
            audioContextGain.gain.value = 0;
        }
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
    return $sketchElement;
}

export interface ISketchOptions {
    showInstructions?: boolean;
}