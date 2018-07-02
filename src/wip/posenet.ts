import * as posenet from '@tensorflow-models/posenet';
import { assertValidOutputStride, assertValidScaleFactor } from '@tensorflow-models/posenet/dist/mobilenet';
import { InputType } from '@tensorflow-models/posenet/dist/posenet';
import { getValidResolution } from '@tensorflow-models/posenet/dist/util';
import * as tf from "@tensorflow/tfjs";

import { ISketch } from "../sketch";

export default class Posenet extends ISketch {
    init() {
        const image = document.createElement("img");
        image.src = "/assets/images/self_800x500.jpg";
        image.style.position = "absolute";
        image.style.height = "500px";
        image.style.width = "800px";

        image.onload = () => this.estimatePose(image);
        this.canvas.parentElement!.appendChild(image);
    }

    async estimatePose(img: HTMLImageElement) {
        const net = await posenet.load(0.5);

        const { heatmapScores, offsets} = this.estimateSinglePoseHeatmapAndOffset(net, img, 0.5, false, 16);

        // console.log(heatmapScores, offsets);

        const data = heatmapScores.dataSync() as Float32Array;
        const [height, width, depth] = heatmapScores.shape;
        console.log(data.length, height, width, depth, heatmapScores.size);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                for (let z = 0; z < depth; z++) {
                    // const index = z * (width * height) + x * height + y;
                    const index = y * (width * depth) + x * depth + z;
                    const confidence = data[index];

                    const div = document.createElement("div");
                    div.style.position = "absolute";
                    div.style.zIndex = "100";
                    div.style.width = img.width / width + "px";
                    div.style.height = img.height / height + "px";
                    div.style.left = x / width * img.width + "px";
                    div.style.top = y / height * img.height + "px";
                    div.style.background = "white";
                    div.style.opacity = "" + confidence;
                    this.canvas.parentElement!.appendChild(div);
                }
            }
        }

        // const pose = await net.estimateSinglePose(img, 0.5, false, 16);

        // console.log(pose);
        // for (const keypoint of pose.keypoints) {
        // }
    }

    estimateSinglePoseHeatmapAndOffset(net: posenet.PoseNet, input: InputType, imageScaleFactor = 0.5, flipHorizontal = false, outputStride: 32 | 16 | 8 = 16) {
        assertValidOutputStride(outputStride);
        assertValidScaleFactor(imageScaleFactor);
        const resizedHeight = getValidResolution(imageScaleFactor, input.height, outputStride);
        const resizedWidth = getValidResolution(imageScaleFactor, input.width, outputStride);
        return tf.tidy(() => {
            const inputTensor = toInputTensor(input, resizedHeight, resizedWidth, flipHorizontal);
            const {heatmapScores, offsets} = net.predictForSinglePose(inputTensor, outputStride);
            return {
                heatmapScores: heatmapScores as tf.Tensor3D,
                offsets: offsets as tf.Tensor3D,
            };
        });
        // return [4, decodeSinglePose(heatmapScores, offsets, outputStride)];
    }

    animate(dt: number) {

    }
}

function toInputTensor(input: InputType, resizeHeight: number, resizeWidth: number, flipHorizontal: boolean) {
    const imageTensor = tf.fromPixels(input);
    if (flipHorizontal) {
        return imageTensor.reverse(1).resizeBilinear([resizeHeight, resizeWidth]);
    } else {
        return imageTensor.resizeBilinear([resizeHeight, resizeWidth]);
    }
}
