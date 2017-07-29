import * as React from "react";
import * as ReactDOM from "react-dom";

import "./monkeypatchThree";
import { Index } from "./routes/index";

import "./index.scss";

const root = document.createElement("div");
document.body.appendChild(root);
ReactDOM.render(
    <Index />,
    root
);