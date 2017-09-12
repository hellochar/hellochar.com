import * as React from "react";

import { Line } from "../line/index";
import { ISketch } from "../sketch";
import { SketchComponent } from "../sketchComponent";
import { Dots } from "../dots/index";
import { Waves } from "../waves/index";
import { Link, NavLink } from "react-router-dom";
import { RouteComponentProps } from "react-router";
import { ShrinkingHeader } from "./shrinkingHeader";

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
                { this.renderHistory() }
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
                <p>
                    Hi there.
                </p>
                <p>
                    My name's Xiaohan, but everyone just calls me Han-Han (the X can be intimidating!).
                </p>
                <p>
                I am a web developer and creative coder in the San Francisco Bay Area, interested in
                discovering and sharing the beauty of mathematics and physics. Topics of interest
                include emergent systems, generative design, chaos/dynamical systems, self organization,
                physical simulations, UI/UX, and teaching.
                </p>
                <p>
                    <img src="/assets/images/self_800x500.jpg" />
                </p>

                <hr />

                <p>
  I grew up with an intense love for video games. The type of love that consumes your thoughts. The type of love that makes you play eight hours a day, fall asleep to mental flashes of scoring points, and get into daily arguments with mom. I caught the bug and I couldn't escape.
                </p>

                <p>
Just as much as I loved playing games, I loved imagining new ones. My friends and I would go wild, designing and perfecting the Next Great Game. It would have Everything and it would be Perfect. I would give my days to the Warcraft III Map Editor [link], clunkily bringing to life our overstretched dreams. I remember a frenzied two week surge - wake up at 8am, eat breakfast (thanks parents), work till noon, eat lunch (thanks parents), work till 6pm, eat dinner (thanks parents), work till 10pm, sleep. The inevitable end to these projects was total burnout after a few weeks after the initial motivation died down. But that didn't stop us from trying on the next one. In fact, making the game was like a game in itself - the hardest, most rewarding game I'd ever played.
                </p>

                
                 Then an 8th grade math teacher showed our class
                that 
            </article>
        )
    }

    private renderHistory() {
        return (
            <section className="content-section history" id="history">
                2017: did some stuff
                2016: did some stuff
                2015: did some stuff
                2014: did some stuff
                2013: did some stuff
                2012: did some stuff
                2011: did some stuff
                2010: did some stuff
            </section>
        )
    }

    private renderContact() {
        return (
            <footer className="content-section contact" id="contact">
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
            </footer>
        )
    }

    private renderHighlight(name: string, imageUrl: string) {
        const linkUrl = `/sketch/${name.toLowerCase()}`;
        return (
            <figure className="work-highlight">
                <figcaption>
                    <Link className="work-highlight-name" to={linkUrl}>{name}</Link>
                </figcaption>
                <Link to={linkUrl}><img src={imageUrl} /></Link>
            </figure>
        );
    }
}