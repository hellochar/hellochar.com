declare module 'clmtrackr' {
    interface IParams {
        /** whether to use constant velocity model when fitting (default is true) */
        constantVelocity: boolean;
        /** the size of the searchwindow around each point (default is 11) */
        searchWindow: number;
        /** whether to use webGL if it is available (default is true) */
        useWebGL: boolean;
        /** threshold for when to assume we've lost tracking (default is 0.50) */
        scoreThreshold: number;
        /** whether to stop tracking when the fitting has converged (default is false) */
        stopOnConvergence: boolean;
        /** object with parameters for facedetection : */
        faceDetection: object;
        /** whether to use web workers for face detection (default is true) */
        useWebWorkers: boolean;
    }

    type IPosition = [number, number];

    interface IModel {
    }

    export class tracker {
        constructor(params: IParams);

        init(model?: IModel): void;

        start(element: HTMLVideoElement | HTMLCanvasElement): void;

        track(element: HTMLVideoElement | HTMLCanvasElement): IPosition[] | false;

        reset(): void;

        getConvergence(): number;

        getCurrentParameters(): number[];

        getCurrentPosition(): IPosition[];

        getScore(): number;

        draw(canvas: HTMLCanvasElement): void;

        setResponseMode(type: "single" | "cycle" | "blend", list: Array<"raw" | "sobel" | "lbp">): void;

    }

    export const version: string;

    interface DefaultExport {
        tracker: tracker;
        version: string;
    }

    export default DefaultExport;
}