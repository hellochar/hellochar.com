import * as classnames from "classnames";
import { parse } from "query-string";
import * as React from "react";
import { RouteComponentProps } from "react-router";
import { Link } from "react-router-dom";

import { ISketch } from "../sketch";
import { SketchComponent } from "../sketchComponent";
import { ShrinkingHeader } from "./shrinkingHeader";

export interface ISketchRouteProps {
    sketch: ISketch;
}

export class FullPageSketch extends React.Component<ISketchRouteProps, {}> {
    public render() {
        const isPresentationMode = !!parse(location.search).presentationMode;
        const classes = classnames("full-page-sketch", { "presentation-mode": isPresentationMode });
        return (
            <div className={classes}>
                <Link className="back-button" to="/">&#10094;</Link>
                {/* <ShrinkingHeader
                    alwaysShrunken
                    darkTheme={this.props.sketch.darkTheme}
                    onlyShowOnHover
                /> */}
                <SketchComponent sketch={this.props.sketch} />
            </div>
        );
    }
}
