import * as $ from "jquery";
import * as React from "react";
import * as THREE from "three";

import FaVolumeOff = require("react-icons/lib/fa/volume-off");
import FaVolumeUp = require("react-icons/lib/fa/volume-up");

import * as classnames from "classnames";
import { Link } from "react-router-dom";
import { ISketch, SketchAudioContext, SketchConstructor, UI_EVENTS } from "./sketch";

const $window = $(window);
const $body = $(document.body);
const HAS_SOUND = true;

export interface ISketchComponentProps extends React.DOMAttributes<HTMLDivElement> {
    eventsOnBody?: boolean;
    errorElement?: JSX.Element;
    sketchClass: SketchConstructor;
}

export interface SketchSuccess {
    type: "success";
    sketch: ISketch;
}

export interface SketchError {
    type: "error";
    error: Error;
}

export interface SketchLoading {
    type: "loading";
}

export type SketchStatus = SketchSuccess | SketchError | SketchLoading;

// Expects sketch to be setup but not init. SketchSuccessComponent is responsible for:
//      firing resize events
//      attaching ui event listeners
//      keeping focus on the canvas
interface SketchSuccessComponentProps {
    sketch: ISketch;
    eventsOnBody?: boolean;
}
class SketchSuccessComponent extends React.Component<SketchSuccessComponentProps, {frameCount: number}> {
    private frameId?: number;
    private lastTimestamp = 0;
    constructor(props: SketchSuccessComponentProps) {
        super(props);
        this.state = {
            frameCount: props.sketch.frameCount,
        }
    };

    componentDidMount() {
        this.updateRendererCanvasToMatchParent(this.props.sketch.renderer);
        $window.resize(this.handleWindowResize);

        // canvas setup
        const $canvas = $(this.props.sketch.renderer.domElement);
        $canvas.attr("tabindex", 1);
        (Object.keys(UI_EVENTS) as Array<keyof typeof UI_EVENTS>).forEach((eventName) => {
            if (this.props.sketch.events != null) {
                const callback = this.props.sketch.events[eventName];
                if (callback != null) {
                    if (this.props.eventsOnBody) {
                        $body.on(eventName, callback);
                    } else {
                        $canvas.on(eventName, callback);
                    }
                }
            }
        });
        // prevent scrolling the viewport
        // $canvas.on("touchmove", (event) => {
        //     event.preventDefault();
        // });

        // TODO handle errors here
        this.props.sketch.init();
        this.frameId = requestAnimationFrame(this.loop);
    }

    render() {
        const sketchElementsWithKey: React.ReactNode[] = [];
        if (this.props.sketch.render != null) {
            sketchElementsWithKey.push(this.props.sketch.render());
        }
        if (this.props.sketch.elements != null) {
            sketchElementsWithKey.push(...this.props.sketch.elements.map((el, idx) => React.cloneElement(el, { key: idx })));
        }
        return (
            <div className="sketch-elements">
                {sketchElementsWithKey}
            </div>
        );
    }

    componentWillUnmount() {
        if (this.props.sketch.destroy) {
            this.props.sketch.destroy();
        }
        if (this.frameId != null) {
            cancelAnimationFrame(this.frameId);
        }
        this.props.sketch.renderer.dispose();
        $window.off("resize", this.handleWindowResize);

        const $canvas = $(this.props.sketch.canvas);
        (Object.keys(UI_EVENTS) as Array<keyof typeof UI_EVENTS>).forEach((eventName) => {
            if (this.props.sketch.events != null) {
                const callback = this.props.sketch.events[eventName];
                if (callback != null) {
                    if (this.props.eventsOnBody) {
                        $body.off(eventName, callback);
                    } else {
                        $canvas.off(eventName, callback);
                    }
                }
            }
        });
    }

    private loop = (timestamp: number) => {
        const millisElapsed = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        this.props.sketch.frameCount++;
        this.props.sketch.timeElapsed = timestamp;
        try {
            this.props.sketch.animate(millisElapsed);
        } catch (e) {
            console.error(e);
        }

        // force new render()
        this.setState({
            frameCount: this.props.sketch.frameCount,
        });
        this.frameId = requestAnimationFrame(this.loop);
    }

    private handleWindowResize = () => {
        const { renderer } = this.props.sketch;
        this.updateRendererCanvasToMatchParent(renderer);
        if (this.props.sketch.resize != null) {
            this.props.sketch.resize(renderer.domElement.width, renderer.domElement.height);
        }
    }

    private updateRendererCanvasToMatchParent(renderer: THREE.WebGLRenderer) {
        const parent = renderer.domElement.parentElement;
        if (parent != null) {
            renderer.setSize(parent.clientWidth, parent.clientHeight);
        }
    }
}

export interface ISketchComponentState {
    status: SketchStatus;
    volumeEnabled: boolean;
}

export class SketchComponent extends React.Component<ISketchComponentProps, ISketchComponentState> {
    public state: ISketchComponentState = {
        status: { type: "loading" },
        volumeEnabled: JSON.parse(window.localStorage.getItem("sketch-volumeEnabled") || "true"),
    };

    // private renderer?: THREE.WebGLRenderer;
    private audioContext?: SketchAudioContext;
    private userVolume?: GainNode;

    private handleContainerRef = (ref: HTMLDivElement | null) => {
        if (ref != null) {
            try {
                // create dependencies, setup sketch, and move to success state
                // we are responsible for live-updating the global user volume.
                const AudioContextConstructor: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
                const audioContext = this.audioContext = new AudioContextConstructor() as SketchAudioContext;
                (THREE.AudioContext as any).setContext(audioContext);
                this.userVolume = audioContext.createGain();
                this.userVolume.gain.setValueAtTime(0.8, 0);
                this.userVolume.connect(audioContext.destination);
                const audioContextGain = audioContext.gain = audioContext.createGain();
                audioContextGain.connect(this.userVolume);
                document.addEventListener("visibilitychange", this.handleVisibilityChange);

                const renderer = new THREE.WebGLRenderer({ alpha: true, preserveDrawingBuffer: true, antialias: true });
                ref.appendChild(renderer.domElement);

                const sketch = new (this.props.sketchClass)(renderer, this.audioContext);
                this.setState({status: { type: "success", sketch: sketch }});
            } catch (e) {
                this.setState({ status: { type: "error", error: e }});
                console.error(e);
            }
        } else {
            document.removeEventListener("visibilitychange", this.handleVisibilityChange);
            if (this.audioContext != null) {
                this.audioContext.close();
            }
        }
    }

    public render() {
        if (this.userVolume != null && this.audioContext != null) {
            // this.userVolume.gain.value = this.state.volumeEnabled ? 1 : 0;
            if (this.state.volumeEnabled && this.audioContext.state === "suspended") {
                this.audioContext.resume();
            } else if (!this.state.volumeEnabled && this.audioContext.state === "running") {
                this.audioContext.suspend();
            }
        }

        const { sketchClass, ...containerProps } = this.props;
        const className = classnames("sketch-component", this.state.status.type);
        return (
            <div {...containerProps} id={this.props.sketchClass.id} className={className} ref={this.handleContainerRef}>
                {this.renderSketchOrStatus()}
                {this.renderVolumeButton()}
            </div>
        );
    }

    private renderSketchOrStatus() {
        const { status } = this.state;
        if (status.type === "success") {
            // key on id to not destroy and re-create the component somehow
            return <SketchSuccessComponent key={this.props.sketchClass.id} sketch={status.sketch} eventsOnBody={this.props.eventsOnBody} />;
        } else if (status.type === "error") {
            const errorElement = this.props.errorElement || this.renderDefaultErrorElement(status.error.message);
            return errorElement;
        } else if (status.type === "loading") {
            return null;
        }
    }

    private renderDefaultErrorElement(message: string) {
        return (
            <p className="sketch-error">
                Oops - something went wrong! Make sure you're using Chrome, or are on your desktop.
                <pre>{message}</pre>
                <p><Link className="back" to="/">Back</Link></p>
            </p>
        );
    }

    private renderVolumeButton() {
        const { volumeEnabled } = this.state;
        return (
            <button className="user-volume" onClick={this.handleVolumeButtonClick}>
                { volumeEnabled ? <FaVolumeUp /> : <FaVolumeOff /> }
            </button>
        );
    }

    private handleVolumeButtonClick = () => {
        const volumeEnabled = !this.state.volumeEnabled;
        this.setState({ volumeEnabled });
        window.localStorage.setItem("sketch-volumeEnabled", JSON.stringify(volumeEnabled));
    }

    private handleVisibilityChange = () => {
        if (this.audioContext != null) {
            if (document.hidden) {
                this.audioContext.suspend();
            } else if (this.state.volumeEnabled) {
                this.audioContext.resume();
            }
        }
    }
}
