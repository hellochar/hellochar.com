import * as React from "react";

import { Line } from "../line/index";
import { ISketch } from "../sketch";
import { SketchComponent } from "../sketchComponent";
import { Dots } from "../dots/index";
import { Waves } from "../waves/index";
import { Link } from "react-router-dom";

export class HomePage extends React.Component<{}, {}> {
    render() {
        return (
            <div className="root">
                { this.renderHeader() }
                { this.renderContent() }
            </div>
        );
    }
    
    private renderHeader() {
        return (
            <div className="header">
                <Link className="header-name" to="/"><h1>Xiaohan Zhang</h1></Link>
                <nav className="header-nav">
                    <Link to="#work">Work</Link>
                    &middot;
                    <Link to="#about-me">About Me</Link>
                    &middot;
                    <Link to="#history">History</Link>
                    &middot;
                    <Link to="#contact">Contact</Link>
                </nav>
            </div>
        );
    }

    private renderContent() {
        return (
            <div className="content">
                { this.renderWork() }
                { this.renderAboutMe() }
                { this.renderHistory() }
                { this.renderContact() }
            </div>
        );
    }

    private renderWork() {
        return (
            <div className="work">
                { this.renderHighlight("Line", "/assets/images/gravity1.png") }
                { this.renderHighlight("Dots", "/assets/images/dots2.png") }
                { this.renderHighlight("Waves", "/assets/images/waves2.png") }
            </div>
        );
    }

    private renderAboutMe() {
        return (
            <div className="about-me">
                <img src="self-picture.png" />
                <p>
                I am a web developer and creative coder in the San Francisco Bay Area.
                I want to show the breathtaking beauty and awe that is inherent in mathematics
                and physics in a simple, aesthetically pleasing way.
                </p>
                Contact me at hellocharlien@hotmail.com for any further inquiries.
            </div>
        )
    }

    private renderHistory() {
        return (
            <div className="history">
                2017: did some stuff
                2016: did some stuff
                2015: did some stuff
                2014: did some stuff
                2013: did some stuff
                2012: did some stuff
                2011: did some stuff
                2010: did some stuff
            </div>
        )
    }

    private renderContact() {
        return (
            <div className="contact">
                Get in touch:
                email
                facebook
                twitter
            </div>
        )
    }

    private renderHighlight(name: string, imageUrl: string) {
        return (
            <div className="work-highlight">
                <Link className="work-highlight-name" to={`/sketch/${name}`}>{name}</Link>
                <img src={imageUrl} />
            </div>
        );
    }
}