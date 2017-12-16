import clm from "clmtrackr";
import { parse } from "query-string";
import * as React from "react";
import * as THREE from "three";

const tracker = clm.tracker;

import { ISketch, SketchAudioContext } from "../sketch";

const ctracker = new clm.tracker();

function init(_renderer: THREE.WebGLRenderer, _audioContext: SketchAudioContext) {
    const constraints: MediaStreamConstraints = {
        video: true,
    };

    const video = document.getElementsByTagName("video")[0];

    ctracker.init();

    navigator.getUserMedia(
        constraints,
        (localMediaStream) => {
            video.src = window.URL.createObjectURL(localMediaStream);
            ctracker.start(video);
        },
        (e) => {
            console.log('Reeeejected!', e);
        },
    );
}

function animate() {
    const positions = ctracker.getCurrentPosition();
    console.log(positions);
}

export const Webcam: ISketch = {
    id: "webcam",
    init,
    animate,
};
