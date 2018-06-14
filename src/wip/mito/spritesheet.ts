import * as THREE from "three";
import devlog from "../../common/devlog";
import lazy from "../../common/lazy";

const spriteSize = 16; // 16x16 sprites
const spriteSheetWidth = 1024;
const spriteSheetHeight = 512;
let spritesheetLoaded = false;
const SPRITESHEET = lazy(() => new THREE.TextureLoader().load( '/assets/images/roguelikeSheet_transparent.png', (() => {
    SPRITESHEET().dispatchEvent({type: "update"});
    spritesheetLoaded = true;
})));

export const fruitTexture = new THREE.TextureLoader().load('/assets/images/fruit.png');

const cache: { [key: string]: THREE.Texture } = {};
// x, y are spritesheet coordinates, starting top-left and going down/right
export function textureFromSpritesheet(x: number, y: number, backgroundColor = "white") {
    x = Math.floor(x);
    y = Math.floor(y);
    const key = `${x},${y}`;
    if (cache[key] == null) {
        const canvas = document.createElement("canvas");
        canvas.width = spriteSize;
        canvas.height = spriteSize;
        const texture = new THREE.Texture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.flipY = true;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        function drawSpriteToCanvas() {
            const image = SPRITESHEET().image;
            const context = canvas.getContext("2d")!;
            context.fillStyle = backgroundColor;
            context.fillRect(0, 0, spriteSize, 16);
            // context.fillStyle = "white";
            // flip the image vertically
            context.drawImage(image,
                // sx, sy, sWidth, sHeight
                spriteSize * x,
                spriteSize * y,
                spriteSize,
                spriteSize,
                // dx, dy, dWidth, dHeight
                0,
                0,
                spriteSize,
                spriteSize,
            );
            texture.needsUpdate = true;
            devlog("updated spritesheet for", x, y);
        }
        if (spritesheetLoaded) {
            drawSpriteToCanvas();
        } else {
            SPRITESHEET().addEventListener("update", () => {
                drawSpriteToCanvas();
            });
        }
        cache[key] = texture;
    }
    return cache[key];
}
