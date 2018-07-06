import io = require("socket.io-client");
import { Vector3, Vector4 } from "three";

/*
 TODO
 2. z level is an unnormalized integer
 3. associate the body id
 4. detect position not tracked, position tracked, etc.
 */

export interface Body {
    id: number;
    position: Vector3;
    joints: Vector4[];
}

export class KinectManager {
    private socket: SocketIOClient.Socket;
    constructor(public handleUpdate: (bodies: Body[]) => void) {
        this.socket = io();
        this.socket.on('update', this.handleSocketUpdate);
    }

    private handleSocketUpdate = (oscMessage: number[]) => {
        const [_header, ...bodiesMessage] = oscMessage;
        const NUM_OSC_ARGUMENTS_PER_BODY =
            1 + // tracking id
            1 + // tracking state
            3 + // skeleton x/y/z
            (4 * 19) // 19 joints, each with 4
        ;
        const numBodies = bodiesMessage.length / NUM_OSC_ARGUMENTS_PER_BODY;
        const bodies: Body[] = [];
        for (let i = 0; i < numBodies; i++) {
            const bodyMessage = bodiesMessage.slice(i * NUM_OSC_ARGUMENTS_PER_BODY, (i + 1) * NUM_OSC_ARGUMENTS_PER_BODY);
            const [trackingId, _trackingState, sX, sY, sZ, ...jointsMessage] = bodyMessage;
            const joints: Vector4[] = [];
            for (let jointIndex = 0; jointIndex < jointsMessage.length; jointIndex += 4) {
                const x = jointsMessage[jointIndex];
                const y = jointsMessage[jointIndex + 1];
                const z = jointsMessage[jointIndex + 2];
                const trackingState = jointsMessage[jointIndex + 3];
                const joint = new Vector4(x, y, z, trackingState);
                joints.push(joint);
            }
            const body: Body = {
                id: trackingId,
                position: new Vector3(sX, sY, sZ),
                joints,
            };
            bodies.push(body);
        }
        this.handleUpdate(bodies);
    };
}
