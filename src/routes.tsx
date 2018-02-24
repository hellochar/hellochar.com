import * as React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";

import { FullPageSketch } from "./routes/fullPageSketch";
import { HomePage } from "./routes/homePage";
import { ISketch } from "./sketch";

// import * as Sketch from "./sketches";

const sketches = require.context("./sketches", true, /\.\/\w+$/);
const wipSketches = require.context("./wip", true, /\.\/\w+$/);

const sketchRoutes = sketches.keys().map((key) => {
    const sketchModule = sketches(key);
    const sketch = sketchModule.default as ISketch;
    const path = `/${sketch.id}`;
    return <Route path={path} component={() => <FullPageSketch sketch={sketch} />} />;
});

const wipSketchRoutes = sketches.keys().map((key) => {
    const sketchModule = sketches(key);
    const sketch = sketchModule.default as ISketch;
    const path = `wip/${sketch.id}`;
    return <Route path={path} component={() => <FullPageSketch sketch={sketch} />} />;
});

export const Routes = () => (
    <Switch>
        { sketchRoutes }
        { wipSketchRoutes }
        <Route path="/" component={HomePage} />
    </Switch>
);
