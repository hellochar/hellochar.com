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
        const {sketch, ...divProps} = this.props;
        return (
            <div {...divProps} className="sketch-component" ref={this.handleRef}>
            </div>
        );
    }
}

