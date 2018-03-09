import * as $ from "jquery";

import { SketchAudioContext } from "../../sketch";
import * as THREE from "three";

function makeNodeOfAudioAsset(ctx: SketchAudioContext, assetName: string): Unit {
    const audio = (
        $("<audio autoplay loop>")
            // .append(`<source src="/assets/audio/mito/${assetName}.ogg" type="audio/ogg">`)
            .append(`<source src="/assets/audio/mito/${assetName}.mp3" type="audio/mp3">`)
            .append(`<source src="/assets/audio/mito/${assetName}.wav" type="audio/wav">`) as JQuery<HTMLAudioElement>
    )[0];
    const source = ctx.createMediaElementSource(audio);
    const gain = ctx.createGain();
    source.connect(gain);
    return {audio, gain};
}

interface Unit {
    gain: GainNode;
    audio: HTMLAudioElement;
}

export let footsteps: Unit;
export let build: Unit;

export let blopBuffer: THREE.AudioBuffer;

export function hookUpAudio(ctx: SketchAudioContext) {
    // const mito = makeNodeOfAudioAsset(ctx, "mito");
    const {gain: mito} = makeNodeOfAudioAsset(ctx, "mito-base");
    mito.gain.value = 0.5;
    mito.connect(ctx.gain);

    footsteps = makeNodeOfAudioAsset(ctx, "footsteps");
    footsteps.gain.gain.value = 0;
    footsteps.gain.connect(ctx.gain);

    build = makeNodeOfAudioAsset(ctx, "build");
    build.gain.gain.value = 0;
    build.gain.connect(ctx.gain);

    const loader = new THREE.AudioLoader();

    // load a resource
    loader.load(
        // resource URL
        '/assets/audio/mito/Blop-Mark_DiAngelo-79054334.mp3',
        // onLoad callback
        (audioBuffer: THREE.AudioBuffer) => {
            blopBuffer = audioBuffer;
            // set the audio object buffer to the loaded object
            // oceanAmbientSound.setBuffer(audioBuffer);

            // play the audio
            // oceanAmbientSound.play();
        },

        // onProgress callback
        (xhr: ProgressEvent) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },

        // onError callback
        (err: any) => {
            console.log('An error happened');
        }
    );
}

// export function hookUpAudio(ctx: SketchAudioContext) {
//     const basePromise = new Promise<HTMLAudioElement>((resolve, reject) => {
//         const baseEl = (
//             $("<audio loop>")
//                 // .append('<source src="/assets/audio/mito/mito-base.ogg" type="audio/ogg">')
//                 .append('<source src="/assets/audio/mito/mito-base.mp3" type="audio/mp3">') as JQuery<HTMLAudioElement>
//         )[0];
//         baseEl.addEventListener("canplaythrough", () => {
//             resolve(baseEl);
//         });
//     });
//     const drumsPromise = new Promise<HTMLAudioElement>((resolve, reject) => {
//         const drumsEl = (
//             $("<audio loop>")
//             // .append('<source src="/assets/audio/mito/mito-base.ogg" type="audio/ogg">')
//             .append('<source src="/assets/audio/mito/mito-drums.mp3" type="audio/mp3">') as JQuery<HTMLAudioElement>
//         )[0];
//         drumsEl.addEventListener("canplaythrough", () => {
//             resolve(drumsEl);
//         });
//     });

//     Promise.all([basePromise, drumsPromise]).then(([baseEl, drumsEl]) => {
//         const time = ctx.currentTime + 1;
//         hookUpAndStartAudio(ctx, baseEl, time);
//         hookUpAndStartAudio(ctx, drumsEl, time);
//     });
// }

// function hookUpAndStartAudio(ctx: SketchAudioContext, audio: HTMLAudioElement, when: number) {
//     const source = ctx.createMediaElementSource(audio);
//     const buffer: AudioBuffer;
//     audio.play(when);
//     // $("body").append(audioBase);
//     const gain = ctx.createGain();
//     gain.gain.value = 0.2;
//     source.connect(gain);
//     gain.connect(ctx.gain);
// }
