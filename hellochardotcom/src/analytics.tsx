import * as React from "react";
import * as ReactGA from "react-ga";

ReactGA.initialize("UA-59922576-1");

export class GATracker extends React.Component<{}, {}> {
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
