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
                    physical simulations, UI/UX, and teaching.
                </p>
                <p>
                    <img className="self" src="/assets/images/self_800x500.jpg" />
                </p>

                <p>
                    In 9th grade our math teacher described the Chaos Game Method [link] by which
                    to draw the Sierpinski triangle [link]. "An infinite number of smaller and
                    smaller triangles inside each other going down forever?! And you can draw this
                    on the calculator?! WHAT?!" It blew mind, seeing these dots seemily randomly
                    place themselves, but somehow always end up creating triangles within triangles. 
                    I struggled to understand it, even as I had written it just minutes prior. A 
                    prolonged gaze at infinity.
                </p>

                <p style={{width: "50%", marginLeft: "auto", marginRight: "auto"}}>
                    <img className="full-width" src="http://www.rimwe.com/_Media/ti_triangle.jpeg" />
                    <sub>Blew. My. Mind.</sub>
                </p>

                <p>
                    From that birthed explorations into fractals, cellular automata, generative
                    processes, random terrain generation, gravity simulations, geometric shape
                    explorations, more terrain generators, building video games, and more. I spent
                    hours smashing my brain against Java Swing, building a ramshackle 2D gravity
                    simulation with combining and exploding planets, before I found Processing.

                    Much of my high school afterschool was spent in Processing, making sketch after
                    sketch of anything I could think of. That continues to this day.
                </p>

                <p>
                    Much of this came from my parents. They encouraged adventure, exploration, and
                    love of natural beauty. We'd go on weekend trips to national parks, hiking and
                    camping. I would inevitably go off the trail, climbing rocks and jumping over
                    unmarked streams, in an attempt to discover what True, Uncurated Nature was.
                    I didn't want a standard experience. I wanted the real thing. Ironically, I found
                    the real thing in a virtual world. Programming is the ultimate tool for discovery.
                    It's taking a trip to other worlds, and coming back and seeing your own world with new eyes.
                </p>

                <p>
                    While driving over my parents would say "Han-Han look up from that Calculator,
                    look at the natural beauty of the world around us!" What they didn't understand
                    was that I was doing exactly that. I was building systems and simulations to
                    quell my curiosity about the natural world. How do mountains get their valleys
                    and canyons? How are clouds formed? Why do birds end up flocking? To see with
                    new eyes as you unearthed an understanding of what a tree was, or how clouds
                    were formed. To make my parents proud.
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
        const linkUrl = `/sketch/${name.toLowerCase()}`;
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