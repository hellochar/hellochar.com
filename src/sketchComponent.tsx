import * as $ from "jquery";
import * as React from "react";
import * as THREE from "three";

import * as classnames from "classnames";
import { Link } from "react-router-dom";
import { ISketch, SketchAudioContext } from "./sketch";

const $window = $(window);
const HAS_SOUND = true;

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
    volumeEnabled: boolean;
}

export class SketchComponent extends React.Component<ISketchComponentProps, ISketchComponentState> {
    public state: ISketchComponentState = {
        status: SketchStatus.LOADING,
        volumeEnabled: JSON.parse(window.localStorage.getItem("sketch-volumeEnabled") || "true"),
    };

    private renderer: THREE.WebGLRenderer;
    private audioContext: SketchAudioContext;
    private userVolume: GainNode;

    private handleCanvasRef = (ref: HTMLCanvasElement | null) => {
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
        if (this.userVolume != null) {
            this.userVolume.gain.value = this.state.volumeEnabled ? 1 : 0;
        }
        const {sketch, ...divProps} = this.props;
        const { status } = this.state;
        if (status === SketchStatus.ERROR) {
            return (
                <div {...divProps} id={sketch.id} className="sketch-component">
                    <p className="sketch-error">
                        Oops - something went wrong! Try again later.
                        <p><Link className="back" to="/">Back</Link></p>
                    </p>
                </div>
            );
        } else if (status === SketchStatus.ERROR_WEBGL) {
            return (
                <div {...divProps} id={sketch.id} className="sketch-component">
                    <p className="sketch-error">
                        Your browser doesn't support WebGL. Try visiting this page in Chrome.
                        <p><Link className="back" to="/">Back</Link></p>
                    </p>
                </div>
            );
        } else {
            const canvasProps = sketch.canvasProps;
            // TODO optimize
            const handleTouchMove: React.TouchEventHandler<HTMLCanvasElement> = (event) => {
                // prevent scrolling the viewport
                // TODO check if we still need this
                event.preventDefault();
                if (canvasProps.onTouchMove) {
                    canvasProps.onTouchMove(event);
                }
            };

            return (
                <div {...divProps} id={sketch.id} className="sketch-component">
                    <div className="sketch-elements">
                        { sketch.elements }
                    </div>
                    { this.renderVolumeButton() }
                    <canvas {...canvasProps} onTouchMove={handleTouchMove} tabIndex={1} ref={this.handleCanvasRef} />
                </div>
            );
        }
    }

    private renderVolumeButton() {
        const { volumeEnabled } = this.state;
        const volumeElementClassname = classnames("fa", {
            "fa-volume-off": !volumeEnabled,
            "fa-volume-up": volumeEnabled,
        });
        return (
            <button className="user-volume" onClick={this.handleVolumeButtonClick}>
                <i className={volumeElementClassname} aria-hidden="true" />
            </button>
        );
    }

    private handleVolumeButtonClick = () => {
        const volumeEnabled = !this.state.volumeEnabled;
        this.setState({ volumeEnabled });
        window.localStorage.setItem("sketch-volumeEnabled", JSON.stringify(volumeEnabled));
    }

    private handleWindowResize = () => {
        this.setCanvasDimensions(this.renderer);
        if (this.props.sketch.resize != null) {
            this.props.sketch.resize(this.renderer.domElement.width, this.renderer.domElement.height);
        }
    }

    private handleVisibilityChange = () => {
        if (document.hidden) {
            this.audioContext.suspend();
        } else {
            this.audioContext.resume();
        }
    }

    private lastTimestamp = 0;
    private animateAndRequestAnimFrame = (timestamp: number) => {
        const millisElapsed = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        this.props.sketch.timeElapsed = timestamp;
        this.props.sketch.animate(millisElapsed);
        if (this.state.status === SketchStatus.LOADED) {
            requestAnimationFrame(this.animateAndRequestAnimFrame);
        }
    }

    private initializeSketch(sketch: ISketch, canvas: HTMLCanvasElement) {
        let renderer: THREE.WebGLRenderer;
        try {
            renderer = this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, preserveDrawingBuffer: true, antialias: true });
        } catch (e) {
            throw new Error("WebGL error");
        }
        this.setCanvasDimensions(renderer);

        $window.resize(this.handleWindowResize);

        // initialize and run sketch
        const audioContext = this.audioContext = new AudioContext() as SketchAudioContext;

        this.userVolume = audioContext.createGain();
        this.userVolume.gain.value = 0.8;
        this.userVolume.connect(audioContext.destination);

        const audioContextGain = audioContext.gain = audioContext.createGain();
        audioContextGain.connect(this.userVolume);

        document.addEventListener("visibilitychange", this.handleVisibilityChange);

        sketch.setup(renderer, audioContext);
        sketch.init();
        requestAnimationFrame(this.animateAndRequestAnimFrame);
    }

    private destroySketch() {
        if (this.renderer != null) {
            this.renderer.dispose();
        }
        $window.off("resize", this.handleWindowResize);
        if (this.audioContext != null) {
            this.audioContext.close();
            document.removeEventListener("visibilitychange", this.handleVisibilityChange);
        }
        this.setState({ status: SketchStatus.ERROR });
        const { sketch } = this.props;
        if (sketch.destroy) {
            sketch.destroy();
        }
    }

    private setCanvasDimensions(renderer: THREE.WebGLRenderer) {
        const parent = renderer.domElement.parentElement!;
        renderer.setSize(parent.clientWidth, parent.clientHeight);
    }
}
