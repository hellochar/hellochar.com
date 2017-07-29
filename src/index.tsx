import * as React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import * as ReactDOM from "react-dom";

import "./monkeypatchThree";
import { Dots } from "./dots/index";
import { Line } from "./line/index";
import { Waves } from "./waves/index";
import { Index } from "./routes/index";
import { SketchRoute } from "./routes/sketch";

import "./index.scss";

const root = document.createElement("div");
document.body.appendChild(root);
ReactDOM.render(
    <BrowserRouter>
        <Switch>
            <Route path="/sketch/line" component={() => <SketchRoute sketch={Line} />} />
            <Route path="/sketch/dots" component={() => <SketchRoute sketch={Dots} />} />
            <Route path="/sketch/waves" component={() => <SketchRoute sketch={Waves} />} />
            <Route path="/" component={Index} />
        </Switch>
    </BrowserRouter>,
    root
);