import * as io from "socket.io-client";

export interface OpenPosePerson {
    /**
     * This is the one we want.
     * {0,  "Head"},
     * {1,  "Neck"},
     * {2,  "RShoulder"},
     * {3,  "RElbow"},
     * {4,  "RWrist"},
     * {5,  "LShoulder"},
     * {6,  "LElbow"},
     * {7,  "LWrist"},
     * {8,  "RHip"},
     * {9,  "RKnee"},
     * {10, "RAnkle"},
     * {11, "LHip"},
     * {12, "LKnee"},
     * {13, "LAnkle"},
     * {14, "Chest"},
     * {15, "Background"}
     */
    pose_keypoints_2d: number[],
    face_keypoints_2d: number[],
    hand_left_keypoints_2d: number[],
    hand_right_keypoints_2d: number[],
    pose_keypoints_3d: number[],
    face_keypoints_3d: number[],
    hand_left_keypoints_3d: number[],
    hand_right_keypoints_3d: number[],
}

export interface OpenPoseKeypoints {
    version: string;
    people: OpenPosePerson[];
}

export class OpenPoseManager {
    /**
     * Latest update. May be null.
     */
    latestFrame?: OpenPoseKeypoints;

    /**
     * Socket used to communicate with server.
     */
    socket?: SocketIOClient.Socket;

    constructor(nodeEnv = process.env.NODE_ENV) {
        if (nodeEnv === "development") {
            // spoof 25fps frames coming in
            const frames: OpenPoseKeypoints[] = require("./test_openpose_keypoint_data.json");
            let frameIndex = 0;
            setInterval(() => {
                frameIndex = (frameIndex + 1) % frames.length;
                this.latestFrame = frames[frameIndex];
            }, 1000 / 25);
        } else {
            this.socket = io();
            this.socket.on('update', (frame: OpenPoseKeypoints) => {
                this.latestFrame = frame;
            });
        }
    }

    public getLatestFramePeople() {
        if (this.latestFrame == null) {
            return [];
        } else {
            return this.latestFrame.people;
        }
    }
}
