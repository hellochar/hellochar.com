import * as React from "react";
import { RouteComponentProps } from "react-router";
import { SketchComponent } from "../sketchComponent";
import { ISketch } from "../sketch";

export interface ISketchRouteProps {
    sketch: ISketch;
}

export class SketchRoute extends React.Component<ISketchRouteProps, {}> {
    public render() {
        return (
            <div className="sketch-full-page">
                <SketchComponent sketch={this.props.sketch} />
            </div>
        );
    }
}