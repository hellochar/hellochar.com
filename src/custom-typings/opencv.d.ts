declare namespace cv {
    enum MatDataType {
        CV_8UC1,
        CV_8UC4,
        CV_8U,
    }

    const CV_8U: MatDataType;
    const CV_8UC1: MatDataType;
    const CV_8UC4: MatDataType;

    interface IDeletable {
        delete(): void;
    }

    class VideoCapture {
        constructor(videoElement: HTMLVideoElement);

        /**
         * copy the video element data into the frame.
         */
        read(frame: Mat): void;
    }

    class Mat implements IDeletable {
        static ones(width: number, height: number, dataType: MatDataType): Mat;

        cols: number;
        data: Uint8Array;
        rows: number;

        constructor();
        constructor(width: number, height: number, dataType: MatDataType);

        delete(): void;
    }

    class BackgroundSubtractorMOG2 implements IDeletable {
        /**
         * 
         * @param history Length of the history.
         * @param varThreshold Threshold on the squared distance between the pixel and the sample to decide whether a pixel is close to that sample. This parameter does not affect the background update.
         * @param detectShadows If true, the algorithm will detect shadows and mark them. It decreases the speed a bit, so if you do not need this feature, set the parameter to false.
         */
        constructor(history: number, varThreshold: number, detectShadows: boolean);

        /**
         * 
         * @param frame Next video frame. Floating point frame will be used without scaling and should be in range [0,255].
         * @param fgmask The output foreground mask as an 8-bit binary image.
         * @param learningRate The value between 0 and 1 that indicates how fast the background model is learnt. Negative parameter value makes the algorithm to use some automatically chosen learning rate. 0 means that the background model is not updated at all, 1 means that the background model is completely reinitialized from the last frame.
         */
        apply(frame: Mat, fgmask: Mat, learningRate?: number): void;

        delete(): void;
    }

    class Size {
        constructor(w: number, h: number);
    }

    class Point {
        constructor(x: number, y: number);
    }

    enum BorderType {
        BORDER_CONSTANT,
        BORDER_REPLICATE,
        BORDER_REFLECT,
        BORDER_WRAP,
        BORDER_REFLECT_101,
        BORDER_TRANSPARENT,
        BORDER_REFLECT101,
        BORDER_DEFAULT,
        BORDER_ISOLATED,
    }

    const BORDER_CONSTANT: BorderType;
    const BORDER_DEFAULT: BorderType;

    function blur(src: Mat, dst: Mat, ksize: Size, anchor: Point, borderType?: cv.BorderType): void;

    function dilate(src: Mat, dst: Mat, M: Mat, anchor: Point, iterations: number, borderType?: cv.BorderType, borderValue?: number): void;
    function erode(src: Mat, dst: Mat, M: Mat, anchor: Point, iterations: number, borderType?: cv.BorderType, borderValue?: number): void;

    function morphologyDefaultBorderValue(): number;

    /**
     * Render the mat onto the canvas.
     * @param canvasElementName 
     * @param mat 
     */
    function imshow(canvasElementName: string | HTMLCanvasElement, mat: Mat): void;

    type HoughGradient = number;
    const HOUGH_GRADIENT: HoughGradient;
    function HoughCircles(src: Mat, circles: Mat, method: HoughGradient, dp: number, minDist: number, param1: number, param2: number, minRadius: number, maxRadius: number): void;
}