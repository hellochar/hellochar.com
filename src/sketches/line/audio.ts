import * as $ from "jquery";

import { SketchAudioContext } from "../../sketch";

export function createAudioGroup(ctx: SketchAudioContext) {
    const backgroundAudio = $("<audio autoplay loop>")
        .append('<source src="/assets/sketches/line/line_background.ogg" type="audio/ogg">')
        .append('<source src="/assets/sketches/line/line_background.mp3" type="audio/mp3">') as JQuery<HTMLMediaElement>;

    const sourceNode = ctx.createMediaElementSource(backgroundAudio[0]);
    $("body").append(backgroundAudio);

    const backgroundAudioGain = ctx.createGain();
    backgroundAudioGain.gain.value = 0.5;
    sourceNode.connect(backgroundAudioGain);
    backgroundAudioGain.connect(ctx.gain);

    // white noise
    const noise = (() => {
        const node = ctx.createBufferSource()
            , buffer = ctx.createBuffer(1, ctx.sampleRate * 5, ctx.sampleRate)
            , data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) {
            data[i] = Math.random();
        }
        node.buffer = buffer;
        node.loop = true;
        node.start(0);
        return node;
    })();

    const noiseSourceGain = ctx.createGain();
    noiseSourceGain.gain.value = 0;
    noise.connect(noiseSourceGain);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 0;
    noiseFilter.Q.value = 1.0;
    noiseSourceGain.connect(noiseFilter);

    const noiseShelf = ctx.createBiquadFilter();
    noiseShelf.type = "lowshelf";
    noiseShelf.frequency.value = 2200;
    noiseShelf.gain.value = 8;
    noiseFilter.connect(noiseShelf);

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 1.0;
    noiseShelf.connect(noiseGain);

    const BASE_FREQUENCY = 320;
    function detuned(freq: number, centsOffset: number) {
        return freq * Math.pow(2, centsOffset / 1200);
    }
    function semitone(freq: number, semitoneOffset: number) {
        return detuned(freq, semitoneOffset * 100);
    }
    const source1 = (() => {
        const node = ctx.createOscillator();
        node.frequency.value = detuned(BASE_FREQUENCY / 2, 2);
        node.type = "square";
        node.start(0);

        const gain = ctx.createGain();
        gain.gain.value = 0.30;
        node.connect(gain);

        return gain;
    })();
    const source2 = (() => {
        const node = ctx.createOscillator();
        node.frequency.value = BASE_FREQUENCY;
        node.type = "sawtooth";
        node.start(0);

        const gain = ctx.createGain();
        gain.gain.value = 0.30;
        node.connect(gain);

        return gain;
    })();

    const sourceLow = (() => {
        const node = ctx.createOscillator();
        node.frequency.value = BASE_FREQUENCY / 4;
        node.type = "sawtooth";
        node.start(0);

        const gain = ctx.createGain();
        gain.gain.value = 0.90;
        node.connect(gain);

        return gain;
    })();

    function makeChordSource(baseFrequency: number) {
        const base = ctx.createOscillator();
        base.frequency.value = baseFrequency;
        base.start(0);

        const octave = ctx.createOscillator();
        octave.frequency.value = semitone(baseFrequency, 12);
        octave.type = "sawtooth";
        octave.start(0);

        const fifth = ctx.createOscillator();
        fifth.frequency.value = semitone(baseFrequency, 12 + 7);
        fifth.type = "sawtooth";
        fifth.start(0);

        const octave2 = ctx.createOscillator();
        octave2.frequency.value = semitone(baseFrequency, 24);
        octave2.type = "sawtooth";
        octave2.start(0);

        const fourth = ctx.createOscillator();
        fourth.frequency.value = semitone(baseFrequency, 24 + 4);
        fourth.start(0);

        const gain = ctx.createGain();
        gain.gain.value = 0.0;
        base.connect(gain);
        octave.connect(gain);
        fifth.connect(gain);
        octave2.connect(gain);
        fourth.connect(gain);

        return gain;
    }
    const chordSource = makeChordSource(BASE_FREQUENCY);
    const chordHigh = makeChordSource(BASE_FREQUENCY * 8);

    const sourceGain = ctx.createGain();
    sourceGain.gain.value = 0.0;

    const sourceLfo = ctx.createOscillator();
    sourceLfo.frequency.value = 8.66;
    sourceLfo.start(0);

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0;

    sourceLfo.connect(lfoGain);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 0;
    filter.Q.value = 2.18;

    const filter2 = ctx.createBiquadFilter();
    filter2.type = "bandpass";
    filter2.frequency.value = 0;
    filter2.Q.value = 2.18;

    const filterGain = ctx.createGain();
    filterGain.gain.value = 0.4;

    chordSource.connect(sourceGain);
    source1.connect(sourceGain);
    source2.connect(sourceGain);
    sourceLow.connect(sourceGain);
    chordHigh.connect(filter);
    sourceGain.connect(filter);

    lfoGain.connect(filter.frequency);
    lfoGain.connect(filter2.frequency);
    filter.connect(filter2);
    filter2.connect(filterGain);

    const audioGain = ctx.createGain();
    audioGain.gain.value = 1.0;

    noiseGain.connect(audioGain);
    filterGain.connect(audioGain);

    const analyser = ctx.createAnalyser();
    audioGain.connect(analyser);

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 12;
    compressor.ratio.value = 2;
    analyser.connect(compressor);

    const highAttenuation = ctx.createBiquadFilter();
    highAttenuation.type = "highshelf";
    highAttenuation.frequency.value = BASE_FREQUENCY * 4;
    highAttenuation.gain.value = -6;
    compressor.connect(highAttenuation);

    const highAttenuation2 = ctx.createBiquadFilter();
    highAttenuation2.type = "highshelf";
    highAttenuation2.frequency.value = BASE_FREQUENCY * 8;
    highAttenuation2.gain.value = -6;
    highAttenuation.connect(highAttenuation2);

    highAttenuation2.connect(ctx.gain);

    return {
        analyser,
        chordGain: chordSource,
        sourceGain,
        sourceLfo,
        lfoGain,
        filter,
        filter2,
        filterGain,
        setFrequency(freq: number) {
            filter.frequency.value = freq;
            filter2.frequency.value = freq;
            lfoGain.gain.value = freq * .06;
        },
        setNoiseFrequency(freq: number) {
            noiseFilter.frequency.value = freq;
        },
        setVolume(volume: number) {
            sourceGain.gain.value = volume / 6;
            noiseSourceGain.gain.value = volume * 0.05;
            chordSource.gain.value = 0.10;
            chordHigh.gain.value = volume / 30;
        },
        setBackgroundVolume(volume: number) {
            backgroundAudioGain.gain.value = volume;
        },
    };
}
