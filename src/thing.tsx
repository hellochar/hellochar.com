import * as React from "react";

console.log("module itself ran");

export default class Thing extends React.Component<{}, {}> {
    render() {
        return (<div>Hello!</div>);
    }
}
