import * as React from "react";

import { Line } from "../line/index";
import { ISketch } from "../sketch";
import { SketchComponent } from "../sketchComponent";
import { Dots } from "../dots/index";
import { Waves } from "../waves/index";
import { Link, NavLink } from "react-router-dom";
import { RouteComponentProps } from "react-router";
import { ShrinkingHeader } from "./shrinkingHeader";
import { HistorySection } from "../history";

export class HomePage extends React.Component<RouteComponentProps<void>, {}> {
    render() {
        return (
            <div className="homepage">
                { this.renderHeader() }
                { this.renderContent() }
            </div>
        );
    }

    public componentDidMount() {
        const hash = this.props.location.hash;
        const element = document.getElementById(hash);
        if (element != null) {
            element.scrollIntoView();
        }
    }
    
    private renderHeader() {
        return <ShrinkingHeader />;
    }

    private renderContent() {
        return (
            <main className="content">
                { this.renderWork() }
                { this.renderAboutMe() }
                { this.renderContact() }
                <HistorySection />
            </main>
        );
    }

    private renderWork() {
        return (
            <section className="content-section work" id="work">
                { this.renderHighlight("Line", "/assets/images/gravity4_cropped.png") }
                { this.renderHighlight("Dots", "/assets/images/dots2.png") }
                { this.renderHighlight("Waves", "/assets/images/waves2.png") }
            </section>
        );
    }

    private renderAboutMe() {
        return (
            <article className="content-section about-me" id="about-me">
                <h1>About Me</h1>
                <p>Hi there.</p>
                <p>My name's Xiaohan, but everyone just calls me Han-Han (the X can be intimidating!).</p>
                <p>
                    I am a web developer and creative coder in the San Francisco Bay Area, interested in
                    discovering and sharing the beauty of mathematics and physics. Topics of interest
                    include emergent systems, generative design, chaos/dynamical systems, self organization,
                    physical simulations, UI/UX, teaching, and psychology
                </p>
                <p>
                    <img className="self" src="/assets/images/self_800x500.jpg" />
                </p>

                <p>
                    My interest in generative art grew from my sense of adventure and discovery
                    in nature. My family would go on weekend trips to national parks, hiking and
                    camping -- I would inevitably go off the trail, climbing rocks and jumping over
                    unmarked streams, in an attempt to discover what True, Uncurated Nature was. I
                    didn't want a standard experience. I wanted the real thing.
                </p>
                <p>
                    Ironically, I found the real thing in programming virtual worlds. How are mountains
                    formed? What would happen if gravity behaved differently? How do infinitely recursive
                    shapes even exist? By allowing you to test and model ideas in minutes, programming
                    is the ultimate tool for discovery. It's taking a trip to other worlds, then coming
                    back and seeing your own world with new eyes.
                </p>

                <p>
                </p>
            </article>
        )
    }

    private renderContact() {
        return (
            <footer className="content-section contact" id="contact">
                <p>
                Get in touch:
                <a href="mailto: hellocharlien@hotmail.com">Email</a>
                &middot;
                <a href="https://www.facebook.com/xiaohan.zhang.16">Facebook</a>
                &middot;
                <a href="https://github.com/hellochar">Github</a>
                &middot;
                <a href="https://twitter.com/hellocharlien">Twitter</a>
                &middot;
                <a href="https://www.linkedin.com/in/xiaohan-zhang-70174341/">LinkedIn</a>
                &middot;
                <a href="https://www.instagram.com/hellochar">Instagram</a>
                </p>
            </footer>
        )
    }

    private renderHighlight(name: string, imageUrl: string) {
        const linkUrl = `/${name.toLowerCase()}`;
        return (
            <figure className="work-highlight">
                <figcaption>
                    <Link className="work-highlight-name" to={linkUrl}>{name}</Link>
                </figcaption>
                <Link to={linkUrl}><img className="full-width" src={imageUrl} /></Link>
            </figure>
        );
    }
}