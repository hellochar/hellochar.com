import * as React from "react";

const Workshops = () => (
    <article className="content-section workshops" id="workshops">
        <h1>Teaching</h1>
        <div className="workshops-listing">
            <div className="workshop">
                <a className="workshop-slides" href="/slides/ccse"><img src="/assets/images/ccse.jpg" /></a>
                <a href="/slides/ccse"><h3 className="workshop-title">Creative Coding for Software Engineers</h3></a>
                <p className="workshop-description">
                    This two hour workshop introduces creative coding libraries, communities, and opportunities to folks with a technical background.
                    By the end of the workshop attendees will know what creative coding is, have built their own p5.js web-based interactive art sketch, and have an understanding of the tools and technologies used by professionals today.
                    Taught at <a href="http://creativetechweek.nyc/">Creative Tech Week 2018.</a>
                </p>
            </div>

            <div className="workshop">
                <a className="workshop-slides" href="/slides/introcc"><img src="/assets/images/introcc.png" /></a>
                <a href="/slides/introcc"><h3 className="workshop-title">Intro to Creative Coding</h3></a>
                <p className="workshop-description">
                    This workshop is a beginner's introduction to making art with code, no coding experience eeded. By the end of the workshop, attendees will know what creative coding is and what it unlocks, how to create art with code, and next steps for deeper engagement.
                    Taught at <a href="http://www.lastfestival.com/">LAST Festival 2018</a>, and <a href="https://www.facebook.com/events/237706303468229/">Stanford ArtX 2018.</a>
                </p>
            </div>

            <div className="workshop">
                <a className="workshop-slides" href="slides/divecc"><img src="/assets/images/divecc.png" /></a>
                <a><h3 className="workshop-title">Tools, Techniques, and Tenacity</h3></a>
                <p className="workshop-description">
                    This workshop will be an in depth exploration of creative coding practice. By the end of the workshop, attendees will have a detailed perspective of the current frontier of digital creative work, familiarity with the software and tools in use today, and practical experience iterating on a creative piece and working towards flow.
                    Taught at <a href="http://www.lastfestival.com/">LAST Festival 2018,</a> and <a href="https://www.facebook.com/events/237706303468229/">Stanford ArtX 2018.</a>
                </p>
            </div>
        </div>
    </article>
);

export default Workshops;
