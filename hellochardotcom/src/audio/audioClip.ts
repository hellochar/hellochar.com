export interface AudioClipOptions {
    context: AudioContext;
    srcs: string[];
    autoplay?: boolean;
    loop?: boolean;
    volume?: number;
}

const DEFAULT_OPTIONS = {
    volume: 1,
    autoplay: false,
    loop: false,
};

export class AudioClip {
    private element: HTMLMediaElement;
    private node: MediaElementAudioSourceNode;
    constructor(options: AudioClipOptions) {
        const { autoplay, loop, volume, srcs } = { ...DEFAULT_OPTIONS, ...options };
        this.element = document.createElement("audio");
        this.element.autoplay = autoplay;
        this.element.loop = loop;
        this.element.volume = volume;
        this.element.preload = "auto";
        for (const srcUrl of srcs) {
            const extension = srcUrl.split(".").pop();
            const source = document.createElement("source");
            source.src = srcUrl;
            source.type = `audio/${extension}`;
            this.element.appendChild(source);
        }

        this.node = options.context.createMediaElementSource(this.element);
    }

    get volume() {
        return this.element.volume;
    }

    set volume(v: number) {
        this.element.volume = v;
    }

    get playbackRate() {
        return this.element.playbackRate;
    }

    set playbackRate(r: number) {
        this.element.playbackRate = r;
    }

    getNode() {
        return this.node;
    }

    play() {
        this.element.currentTime = 0;
        return this.element.play();
    }
}
