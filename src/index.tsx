import * as React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import * as ReactDOM from "react-dom";

import "./monkeypatchThree";
import { Cymatics } from "./cymatics";
import { Dots } from "./dots";
import { Line } from "./line";
import { Waves } from "./waves";
import { HomePage } from "./routes/homePage";
import { FullPageSketch } from "./routes/fullPageSketch";

import "./index.scss";

const root = document.createElement("div");
document.body.appendChild(root);
root.className = "root";
ReactDOM.render(
    <BrowserRouter>
        <Switch>
            <Route path="/line" component={() => <FullPageSketch sketch={Line} />} />
            <Route path="/dots" component={() => <FullPageSketch sketch={Dots} />} />
            <Route path="/waves" component={() => <FullPageSketch sketch={Waves} />} />
            <Route path="/cymatics" component={() => <FullPageSketch sketch={Cymatics} />} />
            <Route path="/" component={HomePage} />
        </Switch>
    </BrowserRouter>,
    root
);