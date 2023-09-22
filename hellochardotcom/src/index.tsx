import * as React from "react";
import * as ReactDOM from "react-dom";

import "./monkeypatch";

import App from "./app";

import "./index.scss";

const root = document.createElement("div");
document.body.appendChild(root);
root.className = "root";

const Error = () => (
    <div style={{width: "800px", fontFamily: "Arial, sans-serif", display: "inline-block", margin: "auto"}}>
        <h2>This is embarassing!</h2>
        <p>Something went wrong, check back later or email me at <a href="mailto:hellocharlien@hotmail.com">hellocharlien (at) hotmail (dot) com</a></p>
    </div>
);

try {
    ReactDOM.render(<App />, root);
    const element = document.getElementById("fallback");
    if (element != null) {
        element.remove();
    }
} catch (e) {
    ga("send", "exception", {
        exDescription: e.message,
        exFatal: true,
    });
    console.error(e);
    const element = document.getElementById("fallback");
    ReactDOM.render(<Error />, element);
}
