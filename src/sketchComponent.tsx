import * as $ from "jquery";
import * as React from "react";
import * as THREE from "three";

import { Link } from "react-router-dom";
import { ISketch, SketchAudioContext, UI_EVENTS } from "./sketch";

const $window = $(window);
let HAS_SOUND = true;

export interface ISketchComponentProps extends React.DOMAttributes<HTMLDivElement> {
    sketch: ISketch;
}

export enum SketchStatus {
    LOADING,
    LOADED,
    ERROR_WEBGL,
    ERROR,
}

export interface ISketchComponentState {
    status: SketchStatus;
}

export class SketchComponent extends React.Component<ISketchComponentProps, ISketchComponentState> {
    public state: ISketchComponentState = {
        status: SketchStatus.LOADING,
    };

    private renderer: THREE.WebGLRenderer;
    private audioContext: SketchAudioContext;

    private handleRef = (ref: HTMLDivElement | null) => {
        if (ref != null) {
            try {
                this.initializeSketch(this.props.sketch, ref);
                this.setState({ status: SketchStatus.LOADED });
            } catch (e) {
                if (e.message === "WebGL error") {
                    this.setState({ status: SketchStatus.ERROR_WEBGL });
                } else {
                    this.setState({ status: SketchStatus.ERROR });
                }
                console.error(e);
            }
        } else {
            // TODO unmount the sketch
            this.destroySketch();
        }
    }

    public render() {
        const {sketch, ...divProps} = this.props;
        const { status } = this.state;
        if (status === SketchStatus.ERROR) {
            return (
                <div {...divProps} id={sketch.id} className="sketch-component" ref={this.handleRef}>
                    <p className="sketch-error">
                        Oops - something went wrong! Try again later.
                        <p><Link className="back" to="/">Back</Link></p>
                    </p>
                </div>
            );
        } else if (status === SketchStatus.ERROR_WEBGL) {
            return (
                <div {...divProps} id={sketch.id} className="sketch-component" ref={this.handleRef}>
                    <p className="sketch-error">
                        Your browser doesn't support WebGL. Try visiting this page in Chrome.
                        <p><Link className="back" to="/">Back</Link></p>
                    </p>
                </div>
            );
        } else {
            return (
                <div {...divProps} id={sketch.id} className="sketch-component" ref={this.handleRef}>
                    <div className="sketch-elements">
                        { sketch.elements }
                    </div>
                </div>
            );
        }
    }

    private handleWindowResize = () => {
        this.setCanvasDimensions(this.renderer, this.renderer.domElement.parentElement!);
        if (this.props.sketch.resize != null) {
            this.props.sketch.resize(this.renderer.domElement.width, this.renderer.domElement.height);
        }
    }

    private lastTimestamp = 0;
    private animateAndRequestAnimFrame = (timestamp: number) => {
        let millisElapsed = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        // if (isElementOnScreen(sketchParent)) {
        //     $sketchElement.removeClass("disabled");
        //     $canvas.focus();
        //     if (HAS_SOUND) {
        //         audioContextGain.gain.value = 1;
        //     }
        this.props.sketch.animate(millisElapsed);
        // } else {
        //     $sketchElement.addClass("disabled");
        //     $canvas.blur();
        //     audioContextGain.gain.value = 0;
        // }
        if (this.state.status === SketchStatus.LOADED) {
            requestAnimationFrame(this.animateAndRequestAnimFrame);
        }
    }

    private initializeSketch(sketch: ISketch, sketchParent: Element) {
        let renderer: THREE.WebGLRenderer;
        try {
            renderer = this.renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true, antialias: true });
        } catch (e) {
            throw new Error("WebGL error");
        }
        sketchParent.appendChild(renderer.domElement);
        this.setCanvasDimensions(renderer, sketchParent);

        $window.resize(this.handleWindowResize);

        // canvas setup
        let $canvas = $(renderer.domElement);
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

        // initialize and run sketch
        const audioContext = this.audioContext = new AudioContext() as SketchAudioContext;
        const audioContextGain = audioContext.createGain();
        audioContextGain.connect(audioContext.destination);
        audioContext.gain = audioContextGain;
        document.addEventListener("visibilitychange", function() {
            if (document.hidden) {
                audioContextGain.gain.value = 0;
            } else {
                audioContextGain.gain.value = 1;
            }
        });

        sketch.init(renderer, audioContext);
        requestAnimationFrame(this.animateAndRequestAnimFrame);
    }

    private destroySketch() {
        if (this.renderer != null) {
            this.renderer.dispose();
        }
        $window.off("resize", this.handleWindowResize);
        if (this.audioContext != null) {
            this.audioContext.close();
        }
        this.setState({ status: SketchStatus.ERROR });
        const { sketch } = this.props;
        if (sketch.destroy) {
            sketch.destroy();
        }
    }

    private setCanvasDimensions(renderer: THREE.WebGLRenderer, sketchParent: Element) {
        renderer.setSize(sketchParent.clientWidth, sketchParent.clientHeight);
    }
}
