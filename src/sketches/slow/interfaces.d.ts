
export type Message = IForegroundUpdateMessage;

export interface IForegroundUpdateMessage {
    type: "foregroundUpdate";
    fgmaskData?: Uint8Array;
    fgmaskWidth: number;
    fgmaskHeight: number;
    now: number;
    camera: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    }
}

export type Response = IPositionColorUpdateResponse;

interface IPositionColorUpdateResponse {
    type: "positionColorUpdate";
    positions: Float32Array;
    colors: Float32Array;
}