import * as classNames from "classnames";
import * as React from "react";

export interface CurtainState {
    closed?: boolean;
}

export class Curtain extends React.PureComponent<{}, CurtainState> {
    state = {
        closed: false,
    };

    render() {
        const className = classNames("curtain", { closed: this.state.closed });
        return <div className={className}></div>;
    }
}
