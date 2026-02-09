import * as React from "react";

import { FaEnvelope, FaFacebookF, FaGithub, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";

import { SketchComponent } from "../../sketchComponent";

import Landscape from "./landscape";

const Hero = () => (
    <header className="hero">
        <div className="hero-sketch">
            <SketchComponent sketchClass={Landscape} eventsOnBody={true} />
        </div>
        <div className="hero-content">
            <h1 className="hero-name">Xiaohan Zhang</h1>
            <p className="header-services">
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
            </p>
            <div className="contact-links">
                <a href="mailto:hellocharlien@hotmail.com">
                    <FaEnvelope />
                </a>
                <a href="https://www.instagram.com/hellochar">
                    <FaInstagram />
                </a>
                <a href="https://www.facebook.com/hellocharlien">
                    <FaFacebookF />
                </a>
                <a href="https://twitter.com/hellocharlien">
                    <FaTwitter />
                </a>
                <a href="https://github.com/hellochar">
                    <FaGithub />
                </a>
                <a href="https://www.linkedin.com/in/xiaohan-zhang-70174341/">
                    <FaLinkedin />
                </a>
            </div>
        </div>
    </header>
);

export default Hero;
