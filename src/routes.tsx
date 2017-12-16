import * as React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";

import { FullPageSketch } from "./routes/fullPageSketch";
import { HomePage } from "./routes/homePage";

import {
    Cymatics,
    Dots,
    Flame,
    Genetics,
    Line,
    Slow,
    Waves,
    Webcam,
} from "./sketches";

export const Routes = () => (
    <Switch>
        <Route path="/line" component={() => <FullPageSketch sketch={Line} />} />
        <Route path="/dots" component={() => <FullPageSketch sketch={Dots} />} />
        <Route path="/waves" component={() => <FullPageSketch sketch={Waves} />} />
        <Route path="/cymatics" component={() => <FullPageSketch sketch={Cymatics} />} />
        <Route path="/flame" component={() => <FullPageSketch sketch={Flame} />} />
        <Route path="/genetics" component={() => <FullPageSketch sketch={Genetics} />} />
        <Route path="/webcam" component={() => <FullPageSketch sketch={Webcam} />} />
        <Route path="/slow" component={() => <FullPageSketch sketch={Slow} />} />
        <Route path="/" component={HomePage} />
    </Switch>
);
