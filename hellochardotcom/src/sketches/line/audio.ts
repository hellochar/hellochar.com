import { AudioClip } from "../../audio";
import { SketchAudioContext } from "../../sketch";

export function createAudioGroup(ctx: SketchAudioContext) {
    const backgroundAudio = new AudioClip({
        context: ctx,
        srcs: [
            "/assets/sketches/line/line_background.mp3",
            "/assets/sketches/line/line_background.ogg",
        ],
        autoplay: true,
        loop: true,
        volume: 0.5,
    });

    backgroundAudio.getNode().connect(ctx.gain);

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
    noiseSourceGain.gain.setValueAtTime(0, 0);
    noise.connect(noiseSourceGain);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.setValueAtTime(0, 0);
    noiseFilter.Q.setValueAtTime(1.0, 0);
    noiseSourceGain.connect(noiseFilter);

    const noiseShelf = ctx.createBiquadFilter();
    noiseShelf.type = "lowshelf";
    noiseShelf.frequency.setValueAtTime(2200, 0);
    noiseShelf.gain.setValueAtTime(8, 0);
    noiseFilter.connect(noiseShelf);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(1.0, 0);
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
        node.frequency.setValueAtTime(detuned(BASE_FREQUENCY / 2, 2), 0);
        node.type = "square";
        node.start(0);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.30, 0);
        node.connect(gain);

        return gain;
    })();
    const source2 = (() => {
        const node = ctx.createOscillator();
        node.frequency.setValueAtTime(BASE_FREQUENCY, 0);
        node.type = "sawtooth";
        node.start(0);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.30, 0);
        node.connect(gain);

        return gain;
    })();

    const sourceLow = (() => {
        const node = ctx.createOscillator();
        node.frequency.setValueAtTime(BASE_FREQUENCY / 4, 0);
        node.type = "sawtooth";
        node.start(0);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.90, 0);
        node.connect(gain);

        return gain;
    })();

    function makeChordSource(baseFrequency: number) {
        const base = ctx.createOscillator();
        base.frequency.setValueAtTime(baseFrequency, 0);
        base.start(0);

        const octave = ctx.createOscillator();
        octave.frequency.setValueAtTime(semitone(baseFrequency, 12), 0);
        octave.type = "sawtooth";
        octave.start(0);

        const fifth = ctx.createOscillator();
        fifth.frequency.setValueAtTime(semitone(baseFrequency, 12 + 7), 0);
        fifth.type = "sawtooth";
        fifth.start(0);

        const octave2 = ctx.createOscillator();
        octave2.frequency.setValueAtTime(semitone(baseFrequency, 24), 0);
        octave2.type = "sawtooth";
        octave2.start(0);

        const fourth = ctx.createOscillator();
        fourth.frequency.setValueAtTime(semitone(baseFrequency, 24 + 4), 0);
        fourth.start(0);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0, 0);
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
    sourceGain.gain.setValueAtTime(0.0, 0);

    const sourceLfo = ctx.createOscillator();
    sourceLfo.frequency.setValueAtTime(8.66, 0);
    sourceLfo.start(0);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0, 0);

    sourceLfo.connect(lfoGain);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(0, 0);
    filter.Q.setValueAtTime(2.18, 0);

    const filter2 = ctx.createBiquadFilter();
    filter2.type = "bandpass";
    filter2.frequency.setValueAtTime(0, 0);
    filter2.Q.setValueAtTime(2.18, 0);

    const filterGain = ctx.createGain();
    filterGain.gain.setValueAtTime(0.4, 0);

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
    audioGain.gain.setValueAtTime(1.0, 0);

    noiseGain.connect(audioGain);
    filterGain.connect(audioGain);

    const analyser = ctx.createAnalyser();
    audioGain.connect(analyser);

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, 0);
    compressor.knee.setValueAtTime(12, 0);
    compressor.ratio.setValueAtTime(2, 0);
    analyser.connect(compressor);

    const highAttenuation = ctx.createBiquadFilter();
    highAttenuation.type = "highshelf";
    highAttenuation.frequency.setValueAtTime(BASE_FREQUENCY * 4, 0);
    highAttenuation.gain.setValueAtTime(-6, 0);
    compressor.connect(highAttenuation);

    const highAttenuation2 = ctx.createBiquadFilter();
    highAttenuation2.type = "highshelf";
    highAttenuation2.frequency.setValueAtTime(BASE_FREQUENCY * 8, 0);
    highAttenuation2.gain.setValueAtTime(-6, 0);
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
            filter.frequency.setTargetAtTime(freq, ctx.currentTime, 0.016);
            filter2.frequency.setTargetAtTime(freq, ctx.currentTime, 0.016);
            lfoGain.gain.setTargetAtTime(freq * .06, ctx.currentTime, 0.016);
        },
        setNoiseFrequency(freq: number) {
            noiseFilter.frequency.setTargetAtTime(freq, ctx.currentTime, 0.016);
        },
        setVolume(volume: number) {
            sourceGain.gain.setTargetAtTime(volume / 6, ctx.currentTime, 0.016);
            noiseSourceGain.gain.setTargetAtTime(volume * 0.05, ctx.currentTime, 0.016);
            chordSource.gain.setTargetAtTime(0.10, ctx.currentTime, 0.016);
            chordHigh.gain.setTargetAtTime(volume / 30, ctx.currentTime, 0.016);
        },
        setBackgroundVolume(volume: number) {
            backgroundAudio.volume = volume;
        },
    };
}
