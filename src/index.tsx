import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactGA from "react-ga";
import { BrowserRouter, Route, Switch } from "react-router-dom";

import "./monkeypatchThree";
import { FullPageSketch } from "./routes/fullPageSketch";
import { HomePage } from "./routes/homePage";
import { Cymatics } from "./sketches/cymatics";
import { Dots } from "./sketches/dots";
import { Flame } from "./sketches/flame";
import { Line } from "./sketches/line";
import { Waves } from "./sketches/waves";

import "./index.scss";

ReactGA.initialize("UA-59922576-1");

class GATracker extends React.Component<{}, {}> {
    public componentDidMount() {
        ReactGA.pageview(window.location.pathname + window.location.search);
    }
    public componentDidUpdate() {
        ReactGA.pageview(window.location.pathname + window.location.search);
    }
    public render() {
        return null;
    }
}

const root = document.createElement("div");
document.body.appendChild(root);
root.className = "root";
ReactDOM.render(
    <BrowserRouter>
        <div>
            <GATracker />
            <Switch>
                <Route path="/line" component={() => <FullPageSketch sketch={Line} />} />
                <Route path="/dots" component={() => <FullPageSketch sketch={Dots} />} />
                <Route path="/waves" component={() => <FullPageSketch sketch={Waves} />} />
                <Route path="/cymatics" component={() => <FullPageSketch sketch={Cymatics} />} />
                <Route path="/flame" component={() => <FullPageSketch sketch={Flame} />} />
                <Route path="/" component={HomePage} />
            </Switch>
        </div>
    </BrowserRouter>,
    root,
);
