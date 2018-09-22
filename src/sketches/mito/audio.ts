import * as $ from "jquery";
import * as THREE from "three";

import devlog from "../../common/devlog";
import { SketchAudioContext } from "../../sketch";

function makeNodeOfAudioAsset(ctx: SketchAudioContext, assetName: string): Unit {
    const audio = (
        $("<audio autoplay loop>")
            .append(`<source src="/assets/audio/mito/${assetName}.ogg" type="audio/ogg">`)
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

export let mito: Unit;
export let strings: Unit;
export let drums: Unit;

export let footsteps: Unit;
export let build: Unit;

export let blopBuffer: THREE.AudioBuffer;
export let suckWaterBuffer: THREE.AudioBuffer;

export function hookUpAudio(ctx: SketchAudioContext) {
    let numDone = 0;
    function oneMoreLoaded() {
        numDone++;
        if (numDone === 3) {
            mito.audio.currentTime = 0;
            strings.audio.currentTime = 0;
            drums.audio.currentTime = 0;
            mito.gain.connect(ctx.gain);
            strings.gain.connect(ctx.gain);
            drums.gain.connect(ctx.gain);
        }
    }
    mito = makeNodeOfAudioAsset(ctx, "mito-base");
    mito.audio.oncanplaythrough = oneMoreLoaded;
    mito.gain.gain.value = 0.5;

    strings = makeNodeOfAudioAsset(ctx, "mito-strings");
    strings.audio.oncanplaythrough = oneMoreLoaded;
    strings.gain.gain.value = 0.0;

    drums = makeNodeOfAudioAsset(ctx, "mito-drums");
    drums.audio.oncanplaythrough = oneMoreLoaded;
    drums.gain.gain.value = 0.0;

    footsteps = makeNodeOfAudioAsset(ctx, "footsteps");
    footsteps.gain.gain.value = 0;
    footsteps.gain.connect(ctx.gain);

    build = makeNodeOfAudioAsset(ctx, "build");
    build.gain.gain.value = 0;
    build.gain.connect(ctx.gain);

    const loader = new THREE.AudioLoader();

    loader.load(
        '/assets/audio/mito/Blop-Mark_DiAngelo-79054334.mp3',
        (audioBuffer: THREE.AudioBuffer) => {
            blopBuffer = audioBuffer;
        },
        (xhr: ProgressEvent) => {
            devlog((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (err: any) => {
            devlog('An error happened');
        },
    );
    loader.load(
        '/assets/audio/mito/suckwater.wav',
        (audioBuffer: THREE.AudioBuffer) => {
            suckWaterBuffer = audioBuffer;
        },
        (xhr: ProgressEvent) => {
            devlog((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (err: any) => {
            devlog('An error happened');
        },
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
