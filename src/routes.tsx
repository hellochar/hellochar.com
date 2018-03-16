import * as React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";

import { FullPageSketch } from "./routes/fullPageSketch";
import { HomePage } from "./routes/homePage";
import { ISketch } from "./sketch";
import sketches = require("./sketches");
import wipSketches = require("./wip");

const sketchRoutes = sketches.map((sketchClass) => {
    const path = `/${sketchClass.id}`;
    return <Route key={path} path={path} component={() => <FullPageSketch sketchClass={sketchClass} />} />;
});

const wipSketchRoutes = wipSketches.map((sketchClass) => {
    const path = `/wip/${sketchClass.id}`;
    return <Route key={path} path={path} component={() => <FullPageSketch sketchClass={sketchClass} />} />;
});

const WipListing = () => (
    <>
        <h1><a href="/">Home</a></h1>
        <ul>
            {
                wipSketches.map((sketch) => (
                    <li>
                        <a href={`/wip/${sketch.id}`}>{sketch.id}</a>
                    </li>
                ))
            }
        </ul>
    </>
);

export const Routes = () => (
    <Switch>
        { sketchRoutes }
        { wipSketchRoutes }
        <Route path="/wip" component={WipListing} />
        <Route path="/" component={HomePage} />
    </Switch>
);
