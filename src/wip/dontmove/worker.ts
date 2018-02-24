import { map } from "../../math";
import { NUM_PARTICLES, NUM_WORKERS, VIDEO_HEIGHT, VIDEO_WIDTH } from "./constants";
import { IPositionColorUpdateResponse, Message } from "./interfaces";

const VELOCITY_POSITION_SCALAR = 0.0001;
const Y_VELOCITY_WAVE_TIMESCALAR = 1 / 10000;
const Y_VELOCITY_WAVE_AMPLITUDESCALAR = 0.0001;
const INIT_PARTICLE_VELOCITY = 0.3;
const FREQ_SPREAD_TIMESCALAR = 1 / 30000;
const FREQ_MIN = 10000;
const FREQ_MAX = 30000;

let fgmaskData: Uint8Array = new Uint8Array([]);
let now: number = 0;
let camera = {
    left: -1,
    right: 1,
    top: 1,
    bottom: -1,
};

class Particle {
    public velocity = { x: 0, y: 0, z: 0};

    public constructor(public position: Float32Array, public color: Float32Array) {
        this.randomizeVelocity();
    }

    public animate() {
        const pixelX = Math.floor(map(this.position[0], camera.left, camera.right, 0, VIDEO_WIDTH));
        const pixelY = Math.floor(map(this.position[1], camera.top, camera.bottom, 0, VIDEO_HEIGHT));
        const pixelIndex = pixelY * VIDEO_WIDTH + pixelX;
        const pixelValue = fgmaskData[pixelIndex] || 0;
        // const pixelValue = 0;

        this.velocity.x += this.position[0] * VELOCITY_POSITION_SCALAR;
        this.velocity.y += this.position[1] * VELOCITY_POSITION_SCALAR;

        this.velocity.y -= Math.sin(now * Y_VELOCITY_WAVE_TIMESCALAR) * Y_VELOCITY_WAVE_AMPLITUDESCALAR;

        const movementScalar = pixelValue / 127 + 0.1;
        // this.color.setRGB(0.4, movementScalar / 1.5 + 0.4, 0.5 + movementScalar / 1.3);
        // // const movementScalar = 1;
        if (pixelValue > 0) {
            this.color[0] = 0;
            this.color[1] = 0;
            this.color[2] = 0;
        } else {
            this.color[0] = 1;
            this.color[1] = 1;
            this.color[2] = 1;
            // this.color.setRGB(0.4, movementScalar / 1.5 + 0.4, 0.5 + movementScalar / 1.3);
        }

        this.position[0] = this.position[0] + this.velocity.x * movementScalar;
        this.position[1] = this.position[1] + this.velocity.y * movementScalar,
        this.position[2] = 0;

        if (this.position[0] > camera.right ||
            this.position[0] < camera.left ||
            this.position[1] > camera.top ||
            this.position[1] < camera.bottom
        ) {
            this.randomizeVelocity();
            this.position[0] = 0;
            this.position[1] = 0;
            this.position[2] = 0;
        }
    }

    public randomizeVelocity() {
        const angle = Math.random() * Math.PI * 2;
        const frequency = map(Math.cos(now * FREQ_SPREAD_TIMESCALAR), -1, 1, FREQ_MIN, FREQ_MAX);
        let velocitySpread = (Math.sin(now / frequency) + 1) / 2;
        velocitySpread *= velocitySpread;
        velocitySpread *= velocitySpread;
        velocitySpread = 1 - velocitySpread;
        const velocity = INIT_PARTICLE_VELOCITY * velocitySpread + Math.random() * INIT_PARTICLE_VELOCITY * (1 - velocitySpread);
        this.velocity.x = Math.cos(angle) * velocity;
        this.velocity.y = Math.sin(angle) * velocity;
        this.color[0] = 1;
        this.color[1] = 1;
        this.color[2] = 1;
    }
}

const positions = new Float32Array(NUM_PARTICLES * 3 / NUM_WORKERS);
const colors = new Float32Array(NUM_PARTICLES * 3 / NUM_WORKERS);

const particles = new Array(NUM_PARTICLES / NUM_WORKERS).fill(null).map((_, idx) => {
    const position = new Float32Array(positions.buffer, 4 * 3 * idx, 3);
    const color = new Float32Array(colors.buffer, 4 * 3 * idx, 3);
    return new Particle(position, color);
});

function animate() {
    for (let i = 0, l = particles.length; i < l; i++) {
        particles[i].animate();
    }
    const message: IPositionColorUpdateResponse = {
        type: "positionColorUpdate",
        positions,
        colors,
    };
    // structured clone the data over to index
    (self as any).postMessage(message);
}

self.addEventListener("message", (e) => {
    const message: Message = e.data;
    if (message.type === "foregroundUpdate") {
        camera = message.camera;
        fgmaskData = message.fgmaskData;
        now = message.now;
        animate();
    }
});
