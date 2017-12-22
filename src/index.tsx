import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactGA from "react-ga";
import { BrowserRouter, Route, Switch } from "react-router-dom";

import { Routes } from "./routes";

import "./index.scss";
import "./monkeypatchThree";

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
            <Routes />
        </div>
    </BrowserRouter>,
    root,
);
