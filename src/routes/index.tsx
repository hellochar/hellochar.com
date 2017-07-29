import * as React from "react";

import { Line } from "../line/index";
import { ISketch } from "../sketch";
import { SketchComponent } from "../sketchComponent";
import { Dots } from "../dots/index";
import { Waves } from "../waves/index";

export class Index extends React.Component<{}, {}> {
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
                <h1 className="header-name">Xiaohan Zhang</h1>
                <nav className="header-nav">
                    <a href="#">Work</a>
                    &middot;
                    <a href="#">About Me</a>
                    &middot;
                    <a href="#">History</a>
                    &middot;
                    <a href="#">Contact</a>
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
                { this.renderSketch("Line", Line) }
                { this.renderSketch("Dots", Dots) }
                { this.renderSketch("Waves", Waves) }
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

    private renderSketch(name: string, sketch: ISketch) {
        return (
            <div className="sketch-container">
                <h2>{name}</h2>
                <img src={sketch.id} />
                {/* <SketchComponent sketch={sketch} /> */}
            </div>
        );
    }
}