const DEFAULT_BG_SUBTRACTOR_HISTORY = 60 * 10; // 60 frames per second * 10 seconds = 10 seconds of history
const DEFAULT_BG_SUBTRACTOR_THRESHOLD = 8 * 8; // 8px value difference counts as foreground

export default class WebcamBackgroundSubtractor {
    private constraints: MediaStreamConstraints = { video: true };
    public video: HTMLVideoElement;

    private cap: cv.VideoCapture;
    private frame: cv.Mat;
    private fgmask: cv.Mat;
    private fgbg: cv.BackgroundSubtractorMOG2;

    constructor(
        public videoWidth: number,
        public videoHeight: number,
        public subtractorHistory = DEFAULT_BG_SUBTRACTOR_HISTORY,
        public subtractorThreshold = DEFAULT_BG_SUBTRACTOR_THRESHOLD,
    ) {
    }

    public init() {
        navigator.mediaDevices.getUserMedia(this.constraints).then((localMediaStream) => {
            const video = this.video = document.createElement("video");
            video.width = this.videoWidth;
            video.height = this.videoHeight;
            video.autoplay = true;
            video.srcObject = localMediaStream;

            this.cap = new cv.VideoCapture(video);

            this.frame = new cv.Mat(video.height, video.width, cv.CV_8UC4);
            this.fgmask = new cv.Mat(video.height, video.width, cv.CV_8UC1);
            this.fgbg = new cv.BackgroundSubtractorMOG2(this.subtractorHistory, this.subtractorThreshold, false);
        }).catch((e) => {
            throw e;
        });
    }

    public update() {
        if (this.cap != null) {
            this.cap.read(this.frame);
            this.fgbg.apply(this.frame, this.fgmask);
            return this.fgmask;
        } else {
            return null;
        }
    }

    /**
     * The foreground mask shows the foreground in full white and the background in full black; the mask has only 1 color channel with 8 bits of depth.
     */
    public getForegroundMask() {
        return this.fgmask;
    }
}
