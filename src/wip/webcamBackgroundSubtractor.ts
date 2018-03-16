const DEFAULT_BG_SUBTRACTOR_HISTORY = 60 * 10; // 60 frames per second * 10 seconds = 10 seconds of history
const DEFAULT_BG_SUBTRACTOR_THRESHOLD = 8 * 8; // 8px value difference counts as foreground

export default class WebcamBackgroundSubtractor {
    constructor(...args: any[]) {}
    [key: string]: any;
}

// export default class WebcamBackgroundSubtractor {
//     private constraints: MediaStreamConstraints = { video: true };
//     public video: HTMLVideoElement;

//     private cap: cv.VideoCapture;
//     private frame: cv.Mat;
//     public fgmask: cv.Mat;
//     public erodeMat: cv.Mat;
//     public blurMat: cv.Mat;
//     public dilateMat: cv.Mat;
//     private fgbg: cv.BackgroundSubtractorMOG2;

//     private debugErode: HTMLCanvasElement;
//     private debugForegroundMask: HTMLCanvasElement;
//     private debugDilate: HTMLCanvasElement;
//     private debugBlur: HTMLCanvasElement;

//     constructor(
//         public videoWidth: number,
//         public videoHeight: number,
//         public subtractorHistory = DEFAULT_BG_SUBTRACTOR_HISTORY,
//         public subtractorThreshold = DEFAULT_BG_SUBTRACTOR_THRESHOLD,
//     ) {
//     }

//     public init() {
//         navigator.mediaDevices.getUserMedia(this.constraints).then((localMediaStream) => {
//             const video = this.video = document.createElement("video");
//             video.width = this.videoWidth;
//             video.height = this.videoHeight;
//             video.autoplay = true;
//             video.srcObject = localMediaStream;

//             if (this.debugEnabled) {
//                 this.debug();
//             }

//             this.cap = new cv.VideoCapture(video);

//             this.frame = new cv.Mat(video.height, video.width, cv.CV_8UC4);
//             this.fgmask = new cv.Mat(video.height, video.width, cv.CV_8UC1);
//             this.fgbg = new cv.BackgroundSubtractorMOG2(this.subtractorHistory, this.subtractorThreshold, false);

//             this.erodeMat = new cv.Mat();
//             this.blurMat = new cv.Mat();
//             this.dilateMat = new cv.Mat();
//             // cv.boxFilter(src, dst, -1, ksize, anchor, true, cv.BORDER_DEFAULT)

//         }).catch((e) => {
//             throw e;
//         });
//     }

//     private debugEnabled = false;
//     public debug() {
//         this.debugEnabled = true;
//         if (this.video != null) {
//             document.body.appendChild(this.video);
//         }
//         if (this.debugForegroundMask == null) {
//             this.debugForegroundMask = document.createElement("canvas");
//             this.debugForegroundMask.width = this.videoWidth;
//             this.debugForegroundMask.height = this.videoHeight;
//             document.body.appendChild(this.debugForegroundMask);
//         }
//         if (this.debugErode == null) {
//             this.debugErode = document.createElement("canvas");
//             this.debugErode.width = this.videoWidth;
//             this.debugErode.height = this.videoHeight;
//             document.body.appendChild(this.debugErode);
//         }
//         if (this.debugDilate == null) {
//             this.debugDilate = document.createElement("canvas");
//             this.debugDilate.width = this.videoWidth;
//             this.debugDilate.height = this.videoHeight;
//             document.body.appendChild(this.debugDilate);
//         }
//         if (this.debugBlur == null) {
//             this.debugBlur = document.createElement("canvas");
//             this.debugBlur.width = this.videoWidth;
//             this.debugBlur.height = this.videoHeight;
//             document.body.appendChild(this.debugBlur);
//         }
//     }

//     public update() {
//         if (this.cap != null) {
//             this.cap.read(this.frame);
//             this.fgbg.apply(this.frame, this.fgmask);

//             const ksize = new cv.Size(5, 5);
//             const anchor = new cv.Point(-1, -1);

//             const dilateKernel = cv.Mat.ones(5, 5, cv.CV_8U);
//             const erodeKernel = cv.Mat.ones(2, 2, cv.CV_8U);

//             cv.erode(this.fgmask, this.erodeMat, erodeKernel, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
//             cv.dilate(this.erodeMat, this.dilateMat, dilateKernel, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
//             cv.blur(this.dilateMat, this.blurMat, ksize, anchor, cv.BORDER_DEFAULT);

//             if (this.debugEnabled) {
//                 cv.imshow(this.debugForegroundMask, this.fgmask);
//                 cv.imshow(this.debugErode, this.erodeMat);
//                 cv.imshow(this.debugDilate, this.dilateMat);
//                 cv.imshow(this.debugBlur, this.blurMat);
//             }
//             return this.fgmask;
//         } else {
//             return null;
//         }
//     }

//     /**
//      * The foreground mask shows the foreground in full white and the background in full black; the mask has only 1 color channel with 8 bits of depth.
//      */
//     public getForegroundMask() {
//         return this.fgmask;
//     }
// }
