import * as $ from "jquery";
import * as THREE from "three";

const spriteSize = 16; // 16x16 sprites
const spriteSheetWidth = 1024;
const spriteSheetHeight = 512;
const SPRITESHEET = new THREE.TextureLoader().load( '/assets/images/roguelikeSheet_transparent.png', (() => {
    SPRITESHEET.dispatchEvent({type: "update"});
}));
// SPRITESHEET.magFilter = THREE.NearestFilter;
// SPRITESHEET.repeat.set(spriteSize / spriteSheetWidth, spriteSize / spriteSheetHeight);
// SPRITESHEET.flipY = true;
// SPRITESHEET.offset.set(16 / 1024 * 50, 16 / 512 * 0);
// console.log(SPRITESHEET);

const cache: { [key: string]: THREE.Texture } = {};
// x, y are spritesheet coordinates, starting top-left and going down/right
export function textureFromSpritesheet(x: number, y: number, backgroundColor = "white") {
    x = Math.floor(x);
    y = Math.floor(y);
    const key = `${x},${y}`;
    if (cache[key] == null) {
        const canvas = $("<canvas>").attr("width", 16).attr("height", 16)[0] as HTMLCanvasElement;
        const texture = new THREE.Texture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.flipY = true;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        SPRITESHEET.addEventListener("update", () => {
            const image = SPRITESHEET.image;
            const context = canvas.getContext("2d")!;
            context.fillStyle = backgroundColor;
            context.fillRect(0, 0, 16, 16);
            // context.fillStyle = "white";
            // flip the image vertically
            context.drawImage(image,
                // sx, sy, sWidth, sHeight
                16 * x,
                16 * y,
                16,
                16,
                // dx, dy, dWidth, dHeight
                0,
                0,
                16,
                16,
            );
            texture.needsUpdate = true;
        });
        // const texture = new THREE.TextureLoader().load( '/assets/images/roguelikeSheet_transparent.png' );
        // texture.magFilter = THREE.NearestFilter;
        // texture.repeat.set(spriteSize / spriteSheetWidth, spriteSize / spriteSheetHeight);
        // texture.flipY = true;
        // texture.offset.set(spriteSize / spriteSheetWidth * x, spriteSize / spriteSheetHeight * y);
        cache[key] = texture;
    }
    return cache[key];
}

// const ARROW_UP = new THREE.TextureLoader().load( '/assets/images/arrow_up16x16.png' );
// ARROW_UP.magFilter = THREE.NearestFilter;
// ARROW_UP.flipY = true;
// export function arrowUpMaterial() {
//     return ARROW_UP;
// }
