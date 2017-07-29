import * as $ from "jquery";
import * as React from "react";

import { initializeSketch, ISketch } from "./sketch";

export interface ISketchComponentProps extends React.DOMAttributes<HTMLDivElement> {
    sketch: ISketch;
}

export class SketchComponent extends React.Component<ISketchComponentProps, {}> {
    private handleRef = (ref: HTMLDivElement) => {
        initializeSketch(this.props.sketch, $(ref), {});
    };

    public render() {
        return (
            <div {...this.props} className="sketch" ref={this.handleRef}>
            </div>
        );
    }
}

