import * as React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";

import { FullPageSketch } from "./routes/fullPageSketch";
import { HomePage } from "./routes/homePage";
import { ISketch } from "./sketch";

function getSketches(context: __WebpackModuleApi.RequireContext) {
    return context.keys().map((key) => {
        const sketchModule = context(key);
        const sketch = sketchModule.default as ISketch;
        if (sketch.id == null) {
            const match = /\.\/(\w+)$/.exec(key)!;
            const id = match[1];
            sketch.id = id;
        }
        return sketch;
    });
}

const sketches = getSketches(require.context("./sketches", true, /\.\/\w+$/));
const wipSketches = getSketches(require.context("./wip", true, /\.\/\w+$/));

const sketchRoutes = sketches.map((sketch) => {
    const path = `/${sketch.id}`;
    return <Route key={path} path={path} component={() => <FullPageSketch sketch={sketch} />} />;
});

const wipSketchRoutes = wipSketches.map((sketch) => {
    const path = `/wip/${sketch.id}`;
    return <Route key={path} path={path} component={() => <FullPageSketch sketch={sketch} />} />;
});

const WipListing = () => (
    <div>
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
    </div>
);

export const Routes = () => (
    <Switch>
        { sketchRoutes }
        { wipSketchRoutes }
        <Route path="/wip" component={WipListing} />
        <Route path="/" component={HomePage} />
    </Switch>
);
