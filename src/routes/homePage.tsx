import * as React from "react";
import { RouteComponentProps } from "react-router";
import { Link, NavLink } from "react-router-dom";

import { Line } from "../line/index";
import { ISketch } from "../sketch";
import { SketchComponent } from "../sketchComponent";
import { Dots } from "../dots/index";
import { Waves } from "../waves/index";
import { ShrinkingHeader } from "./shrinkingHeader";
import { HistorySection } from "./history";

export class HomePage extends React.Component<RouteComponentProps<void>, {}> {
    render() {
        return (
            <div className="homepage">
                { this.renderHeader() }
                { this.renderContent() }
                { this.renderFooter() }
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

    private renderFooter() {
        return (
            <footer className="page-footer">
                <a href="#contact">
                    <div className="get-in-touch">Get in touch</div>
                </a>
                <div className="copyright">
                    &copy; 2013 - present Xiaohan Zhang
                </div>
            </footer>
        )
    }

    private renderWork() {
        return (
            <section className="content-section work" id="work">
                { this.renderHighlight("Line", "/assets/images/gravity4_cropped.png") }
                { this.renderHighlight("Dots", "/assets/images/dots2.png") }
                { this.renderHighlight("Waves", "/assets/images/waves2.png") }
                { this.renderHighlight("Cymatics", "/assets/images/cymatics1.png") }
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
                    I am a new media artist in the San Francisco Bay Area, interested in
                    discovering and sharing the beauty of mathematics and physics. Topics of interest
                    include real time interactive art, emergent systems, generative design, self organization,
                    and physical simulations. I also care about UI, teaching, contributing to the broader
                    creative code community, music, and video games.
                </p>
                <img className="self" src="/assets/images/self_800x500.jpg" />
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
            <section className="content-section contact" id="contact">
                <h1>Get in touch</h1>
                <p>
                    Lets chat! I'm interested in giving talks, workshops, teaching, showing work,
                    site specific installations, interactive work opportunities, getting a coffee,
                    email correspondence, collaborations, going for a walk in the park, connecting
                    like old friends, running away from a bear, etc. etc!
                </p>
                <p className="contact-links">
                    <a href="mailto:hellocharlien@hotmail.com">
                        <i className="fa fa-envelope" aria-hidden="true"></i>
                        Email
                    </a>
                    &middot;
                    <a href="https://www.facebook.com/xiaohan.zhang.16">
                        <i className="fa fa-facebook-official" aria-hidden="true"></i>
                        Facebook
                    </a>
                    &middot;
                    <a href="https://github.com/hellochar">
                        <i className="fa fa-github" aria-hidden="true"></i>
                        Github
                    </a>
                    &middot;
                    <a href="https://twitter.com/hellocharlien">
                        <i className="fa fa-twitter" aria-hidden="true"></i>
                        Twitter
                    </a>
                    &middot;
                    <a href="https://www.linkedin.com/in/xiaohan-zhang-70174341/">
                        <i className="fa fa-linkedin-square" aria-hidden="true"></i>
                        LinkedIn
                    </a>
                    &middot;
                    <a href="https://www.instagram.com/hellochar">
                        <i className="fa fa-instagram" aria-hidden="true"></i>
                        Instagram
                    </a>
                </p>
            </section>
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