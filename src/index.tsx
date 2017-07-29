import * as $ from "jquery";
import * as React from "react";
import * as ReactDOM from "react-dom";

import "./bootstrapWindowHack";
import * as Sketch from "./sketch";
import * as Line from "./line/";
import { initializeSketch, ISketch } from "./sketch";
import { sketch4 } from "./dots/index";

const root = document.createElement("div");
document.body.appendChild(root);

class SketchComponent extends React.Component<{ sketch: ISketch }, {}> {
    private handleRef = (ref: HTMLDivElement) => {
        Sketch.initializeSketch(this.props.sketch, $(ref), {});
    };

    public render() {
        return (
            <div className="sketch" ref={this.handleRef}>
            </div>
        );
    }
}

ReactDOM.render(
    <div>
        <SketchComponent sketch={Line.sketch2} />
        <SketchComponent sketch={sketch4} />
    </div>,
    root
);