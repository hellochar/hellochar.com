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

    public state: IShrinkingHeaderState = {
        scrollTop: this.scrollTop,
    };

    private handleScroll = () => {
        this.setState({scrollTop: this.scrollTop});
    }

    public componentDidMount() {
        window.addEventListener("scroll", this.handleScroll);
    }

    public componentWillUnmount() {
        window.removeEventListener("scroll", this.handleScroll);
    }

    public render() {
        const containerClassName = "header-container"
            + (this.props.darkTheme ? " theme-dark" : " theme-light")
            + (this.props.onlyShowOnHover ? " only-show-on-hover" : "");

        const isMinimized = true;
        const isHidden = this.state.scrollTop < 80;
        const className = "header" + (isMinimized ? " minimized" : "");

        return (
            <div className={containerClassName} style={{display: isHidden ? "none" : ""}}>
                <header className={className}>
                    <a className="header-name" href="/"><h1>Xiaohan Zhang</h1></a>
                    <p className="header-services">
                    Creative technologist with over 12 years experience building interactive exhibits, web experiences, teaching, and workshops.
                    </p>
                    <nav className="header-nav">
                        <a href="/resume.pdf">Resume</a>
                        &middot;
                        <a href="#work">Work</a>
                        &middot;
                        {/* <a href="#installation">Installation</a>
                        &middot; */}
                        <a href="#about-me">About</a>
                        &middot;
                        <a href="#workshops">Teaching</a>
                        &middot;
                        <a href="#contact">Contact</a>
                        &middot;
                        <a href="#history">History</a>
                    </nav>
                </header>
                <div className="extra-hover-area"></div>
            </div>
        );
    }
}
