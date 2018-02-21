import * as React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";

import { FullPageSketch } from "./routes/fullPageSketch";
import { HomePage } from "./routes/homePage";
import { VertexShaderParticles } from "./sketches/vertex_shader_particles";
import { RenderToTexture } from "./sketches/render_to_texture";
import { TextureForPosition } from "./sketches/texture_for_position";

import {
    Cymatics,
    DontMove,
    Dots,
    Flame,
    Genetics,
    Line,
    Waves,
    Waves2,
    Webcam,
} from "./sketches";

export const Routes = () => (
    <Switch>
        <Route path="/line" component={() => <FullPageSketch sketch={Line} />} />
        <Route path="/dots" component={() => <FullPageSketch sketch={Dots} />} />
        <Route path="/waves" component={() => <FullPageSketch sketch={Waves} />} />
        <Route path="/waves2" component={() => <FullPageSketch sketch={Waves2} />} />
        <Route path="/cymatics" component={() => <FullPageSketch sketch={Cymatics} />} />
        <Route path="/flame" component={() => <FullPageSketch sketch={Flame} />} />
        <Route path="/genetics" component={() => <FullPageSketch sketch={Genetics} />} />
        <Route path="/webcam" component={() => <FullPageSketch sketch={Webcam} />} />
        <Route path="/dontmove" component={() => <FullPageSketch sketch={DontMove} />} />
        <Route path="/vertexshaderparticles" component={() => <FullPageSketch sketch={VertexShaderParticles} />} />
        <Route path="/rtt" component={() => <FullPageSketch sketch={RenderToTexture} />} />
        <Route path="/texture_for_position" component={() => <FullPageSketch sketch={TextureForPosition} />} />
        <Route path="/" component={HomePage} />
    </Switch>
);
