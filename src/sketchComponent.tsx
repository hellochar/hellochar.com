import * as $ from "jquery";
import * as React from "react";

import { initializeSketch, ISketch } from "./sketch";
import { Link } from "react-router-dom";

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
    state: ISketchComponentState = {
        status: SketchStatus.LOADING
    };

    private handleRef = (ref: HTMLDivElement | null) => {
        if (ref != null) {
            try {
                initializeSketch(this.props.sketch, $(ref), {});
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
            this.setState({ status: SketchStatus.ERROR });
        }
    };

    public render() {
        const {sketch, ...divProps} = this.props;
        const { status } = this.state;
        if (status === SketchStatus.ERROR) {
            return (
                <div {...divProps} className="sketch-component" ref={this.handleRef}>
                    <p className="sketch-error">
                        Oops - something went wrong! Try again later.
                        <p><Link className="back" to="/">Back</Link></p>
                    </p>
                </div>
            );
        } else if (status === SketchStatus.ERROR_WEBGL) {
            return (
                <div {...divProps} className="sketch-component" ref={this.handleRef}>
                    <p className="sketch-error">
                        Your browser doesn't support WebGL. Try visiting this page in Chrome.
                        <p><Link className="back" to="/">Back</Link></p>
                    </p>
                </div>
            );
        } else {
            return (
                <div {...divProps} className="sketch-component" ref={this.handleRef}>
                </div>
            );
        }
    }
}

