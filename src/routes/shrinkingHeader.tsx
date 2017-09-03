import * as React from "react";
import { Link, NavLink } from "react-router-dom";

export interface IShrinkingHeaderProps {
    alwaysShrunken?: boolean;
    darkTheme?: boolean;
    onlyShowOnHover?: boolean;
}

export interface IShrinkingHeaderState {
    scrollTop: number;
}

export class ShrinkingHeader extends React.Component<IShrinkingHeaderProps, IShrinkingHeaderState> {
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
        const containerClassName = "header-container"
            + (this.props.darkTheme ? " theme-dark": " theme-light")
            + (this.props.onlyShowOnHover ? " only-show-on-hover" : "");

        const isMinimized = this.state.scrollTop > 80 || this.props.alwaysShrunken;
        const className = "header" + (isMinimized ? " minimized" : "")

        return (
            <div className={containerClassName}>
                <div className={className}>
                    <a className="header-name" href="/"><h1>Xiaohan Zhang</h1></a>
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
                <div className="extra-hover-area"></div>
            </div>
        );
    }
}