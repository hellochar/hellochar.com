import * as Leap from "leapjs";
import * as THREE from "three";

import lazy from "../../common/lazy";
import { Attractor, HandMesh } from "../../common/particleSystem";
import { map } from "../../math/index";
import { LineSketch } from "./line";

const boneGeometry = lazy(() => new THREE.SphereGeometry(10, 3, 3));
const boneMeshMaterial = lazy(() => new THREE.MeshBasicMaterial({
    color: 0xadd6b6,
    wireframeLinewidth: 5,
    wireframe: true,
}));

const boneLineMaterial = lazy(() => new THREE.LineBasicMaterial({
    color: 0xadd6b6,
    linewidth: 5,
}));

export function initLeap(sketch: LineSketch) {
    const controller = Leap.loop((frame: Leap.Frame) => {
        if (frame.hands.length > 0) {
            sketch.instructionsEl!.setLastRenderedFrame(sketch.globalFrame);
        }
        sketch.attractors.forEach((attractor) => {
            if (attractor.handMesh != null) {
                attractor.handMesh.visible = false;
            }
            attractor.mesh.visible = false;
            attractor.power = 0;
        });
        frame.hands.filter((hand) => hand.valid).forEach((hand, index) => {
            const position = hand.indexFinger.bones[3].center();

            const {x, y} = mapLeapToThreePosition(sketch.canvas, position);
            sketch.setMousePosition(x, y);

            const attractor = sketch.attractors[index];
            attractor.x = x;
            attractor.y = y;
            attractor.mesh.position.x = x;
            attractor.mesh.position.y = y;

            attractor.mesh.visible = true;
            if (hand.indexFinger.extended) {
                // position[2] goes from -300 to 300
                const wantedPower = Math.pow(7, (-position[2] + 350) / 200);
                attractor.power = attractor.power * 0.5 + wantedPower * 0.5;
            } else {
                attractor.power = attractor.power * 0.5;
            }

            updateHandMesh(sketch, attractor, hand);
            attractor.handMesh!.visible = true;
        });
    });
    return controller;
}

function updateHandMesh(sketch: LineSketch, attractor: Attractor, hand: Leap.Hand) {
    if (attractor.handMesh == null) {
        attractor.handMesh = new THREE.Object3D() as HandMesh;
        sketch.scene.add(attractor.handMesh);
    }
    const handMesh = attractor.handMesh;
    hand.fingers.forEach((finger) => {
        if (handMesh["finger" + finger.type] == null) {
            const fingerLine = new THREE.Line(new THREE.Geometry(), boneLineMaterial());
            handMesh["finger" + finger.type] = fingerLine;
            handMesh.add(fingerLine);
        }
        const fingerGeometry = handMesh["finger" + finger.type].geometry as THREE.Geometry;
        finger.bones.forEach((bone) => {
            // create sphere for every bone
            const id = finger.type + ',' + bone.type;
            if (handMesh[id] == null) {
                const boneMesh = new THREE.Mesh(boneGeometry(), boneMeshMaterial());
                handMesh[id] = boneMesh;
                handMesh.add(boneMesh);
            }
            const position = mapLeapToThreePosition(sketch.canvas, bone.center());
            handMesh[id].position.copy(position);

            // create a line for every finger
            if (fingerGeometry.vertices[bone.type] == null) {
                fingerGeometry.vertices.push(new THREE.Vector3());
            }
            fingerGeometry.vertices[bone.type].copy(position);
            fingerGeometry.verticesNeedUpdate = true;
        });
    });
}

function mapLeapToThreePosition(canvas: HTMLCanvasElement, position: number[]) {
    const range = [0.2, 0.8];
    // position[0] is left/right; left is negative, right is positive. each unit is one millimeter
    const x = map(position[0], -200, 200, canvas.width * range[0],  canvas.width * range[1]);
    // 40 is about 4cm, 1 inch, to 35cm = 13 inches above
    const y = map(position[1], 350, 40,   canvas.height * range[0], canvas.height * range[1]);
    // put the leap stuff close to the camera so the hand is always visible
    const z = 300;
    return new THREE.Vector3(x, y, z);
}
