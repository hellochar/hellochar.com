import { Howl } from "howler";
import * as THREE from "three";

import { SketchAudioContext } from "../../sketch";

export class CymaticsAudio {
    private kick = new Howl({
        src: ["/assets/audio/cymatics/kick.wav"],
    });
    private risingBass = new Howl({
        src: ["/assets/audio/cymatics/risingbass.wav"],
    });
    private blub = new Howl({
        src: ["/assets/audio/cymatics/blub.wav"],
        volume: 0,
        autoplay: true,
        loop: true,
    });

    constructor(public audio: SketchAudioContext) {
    }

    triggerJitter() {
        this.kick.play();
        this.risingBass.play();
    }

    setBlubVolume(v: number) {
        this.blub.volume(THREE.Math.clamp(v, 0, 1));
    }

    setBlubPlaybackRate(r: number) {
        this.blub.rate(THREE.Math.clamp(r, 0.5, 4));
    }
}
