import * as $ from "jquery";

import { SketchAudioContext } from "../../sketch";

export function hookUpAudio(ctx: SketchAudioContext) {
    const audio = (
        $("<audio autoplay loop>")
            // .append('<source src="/assets/audio/mito/mito-base.ogg" type="audio/ogg">')
            .append('<source src="/assets/audio/mito/mito.mp3" type="audio/mp3">') as JQuery<HTMLAudioElement>
    )[0];

    const source = ctx.createMediaElementSource(audio);
    // $("body").append(source);
    const gain = ctx.createGain();
    gain.gain.value = 0.2;
    source.connect(gain);
    gain.connect(ctx.gain);
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
