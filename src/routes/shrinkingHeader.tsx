import * as React from "react";
import { Link, NavLink } from "react-router-dom";

export interface IShrinkingHeaderState {
    scrollTop: number;
}

export class ShrinkingHeader extends React.Component<{}, {}> {
    private get scrollTop() {
        return document.documentElement.scrollTop || document.body.scrollTop;
    }

    state: IShrinkingHeaderState = {
        scrollTop: this.scrollTop,
    };

    private handleScroll = () => {
        this.setState({scrollTop: this.scrollTop});
    };

    componentDidMount() {
        window.addEventListener("scroll", this.handleScroll);
    }

    componentWillUnmount() {
        window.removeEventListener("scroll", this.handleScroll);
    }

    render() {
        const minimized = this.state.scrollTop > 80;
        const className = "header" + (minimized ? " minimized" : "");
        return (
            <div className={className}>
                <Link className="header-name" to="/"><h1>Xiaohan Zhang</h1></Link>
                <nav className="header-nav">
                    <a href="#work">Work</a>
                    &middot;
                    <a href="#about-me">About Me</a>
                    &middot;
                    <a href="#history">History</a>
                    &middot;
                    <a href="#contact">Contact</a>
                </nav>
            </div>
        );
    }
}