import { createWhiteNoise } from "../../audio/noise";
import { SketchAudioContext } from "../../sketch";

export function createAudioGroup(audioContext: SketchAudioContext) {
    // white noise
    const noise = createWhiteNoise(audioContext);
    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0, 0);
    noise.connect(noiseGain);

    const BASE_FREQUENCY = 164.82;
    function detuned(freq: number, centsOffset: number) {
        return freq * Math.pow(2, centsOffset / 1200);
    }
    const source1 = (() => {
        const node = audioContext.createOscillator();
        node.frequency.setValueAtTime(detuned(BASE_FREQUENCY / 2, 2), 0);
        node.type = "triangle";
        node.start(0);

        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(0.3, 0);
        node.connect(gain);

        return gain;
    })();
    const source2 = (() => {
        const node = audioContext.createOscillator();
        node.frequency.setValueAtTime(BASE_FREQUENCY, 0);
        node.type = "triangle";
        node.start(0);

        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(0.30, 0);
        node.connect(gain);

        return gain;
    })();

    const sourceGain = audioContext.createGain();
    sourceGain.gain.setValueAtTime(0.0, 0);

    const lfo = audioContext.createOscillator();
    lfo.frequency.setValueAtTime(8.66, 0);
    lfo.start(0);

    const lfoGain = audioContext.createGain();
    lfoGain.gain.setValueAtTime(0, 0);

    lfo.connect(lfoGain);

    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(0, 0);
    filter.Q.setValueAtTime(5.18, 0);

    const filter2 = audioContext.createBiquadFilter();
    filter2.type = "bandpass";
    filter2.frequency.setValueAtTime(0, 0);
    filter2.Q.setValueAtTime(5.18, 0);

    const filterGain = audioContext.createGain();
    filterGain.gain.setValueAtTime(0.7, 0);

    source1.connect(sourceGain);
    source2.connect(sourceGain);
    sourceGain.connect(filter);

    lfoGain.connect(filter.frequency);
    lfoGain.connect(filter2.frequency);
    filter.connect(filter2);
    filter2.connect(filterGain);

    noiseGain.connect(audioContext.gain);
    filterGain.connect(audioContext.gain);
    return {
        sourceGain,
        lfo,
        lfoGain,
        filter,
        filter2,
        filterGain,
        setFrequency(freq: number) {
            filter.frequency.setTargetAtTime(freq, audioContext.currentTime, 0.016);
            filter2.frequency.setTargetAtTime(freq, audioContext.currentTime, 0.016);
            lfoGain.gain.setTargetAtTime(freq * .06, audioContext.currentTime, 0.016);
        },
        setVolume(volume: number) {
            sourceGain.gain.setValueAtTime(volume, 0);
            noiseGain.gain.setValueAtTime(volume * 0.05, 0);
        },
    };
}
