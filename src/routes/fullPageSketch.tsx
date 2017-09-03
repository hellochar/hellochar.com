import * as React from "react";
import { RouteComponentProps } from "react-router";
import { SketchComponent } from "../sketchComponent";
import { ISketch } from "../sketch";
import { ShrinkingHeader } from "./shrinkingHeader";

export interface ISketchRouteProps {
    sketch: ISketch;
}

export class FullPageSketch extends React.Component<ISketchRouteProps, {}> {
    public render() {
        return (
            <div className="full-page-sketch">
                <ShrinkingHeader
                    alwaysShrunken
                    darkTheme={this.props.sketch.darkTheme}
                    onlyShowOnHover
                />
                <SketchComponent sketch={this.props.sketch} />
            </div>
        );
    }
}