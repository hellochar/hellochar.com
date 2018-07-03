// externally we get everything from WebGLProgram's common

// this has PI, saturate, pow2-pow4, rand(), brightness (called linearToRelativeLuminance), and other stuff
#include <common>

// vec2 resolution

// uniform sampler2D particleState;
// xy = position, ranges in boundsMin/boundsMax
// zw = velocity


// #define VIDEO_WIDTH
// #define VIDEO_HEIGHT

@import ../common-glsl/noise3D;

#define dt (0.1)

const vec4 magic = vec4(1111.1111, 3141.5926, 2718.2818, 0);

const float VELOCITY_POSITION_SCALAR = 0.0001;
const float Y_VELOCITY_WAVE_TIMESCALAR = 1. / 10.;
const float Y_VELOCITY_WAVE_AMPLITUDESCALAR = 0.0001;
const float INIT_PARTICLE_VELOCITY = 0.3;
const float FREQ_SPREAD_TIMESCALAR = 1. / 30.;
const float FREQ_MIN = 10.;
const float FREQ_MAX = 30.;

uniform float iGlobalTime;
// x ranges from [-aspectRatio, aspectRatio]
// y ranges from [-1, 1]
uniform vec2 boundsMin;
uniform vec2 boundsMax;

uniform sampler2D foreground;

float map(float x, float a1, float a2, float b1, float b2) {
    return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );
}

vec2 randPosition(in vec2 uv, in float t) {
    vec2 tc = uv * magic.xy;
    // scale texture coordinates

    vec3 skewed_seed = vec3(t * magic.z + tc.y - tc.x) + magic.yzw;
    // scale and skew seed a bit to decrease noise correlation accross pixels
    // (add some magic numbers to generate three seeds to decrease correlation
    // between velocity coordinates)

    vec3 velocity;
    velocity.x = snoise(vec3(tc.x, tc.y, skewed_seed.x));
    velocity.y = snoise(vec3(tc.y, skewed_seed.y, tc.x));
    velocity.z = snoise(vec3(skewed_seed.z, tc.x, tc.y));

    return fract(velocity.yz * 1000.) * (boundsMax - boundsMin) + vec2(boundsMin);
}

vec2 randomizeVelocity(vec2 uv) {
    float angle = snoise(vec3(uv, iGlobalTime)) * PI2;
    // float angle = rand(uv) * PI2;
    float frequency = map(cos(iGlobalTime * FREQ_SPREAD_TIMESCALAR), -1., 1., FREQ_MIN, FREQ_MAX);
    float velocitySpread = (sin(iGlobalTime / frequency) + 1.) / 2.;
    velocitySpread *= velocitySpread;
    velocitySpread *= velocitySpread;
    velocitySpread = 1. - velocitySpread;
    float velocity = INIT_PARTICLE_VELOCITY * velocitySpread + snoise(vec3(uv * 2. + vec2(12.593, 914.52), iGlobalTime)) * INIT_PARTICLE_VELOCITY * (1. - velocitySpread);
    return vec2(cos(angle) * velocity, sin(angle) * velocity);
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec4 state = texture2D(particleState, uv);
    vec2 position = state.xy;
    vec2 velocity = state.zw;
    if (position == vec2(0.) && velocity == vec2(0.)) {
        // velocity = randomizeVelocity(uv);
        // velocity = randomizeVelocity(uv);
        // position = vec2(rand(uv), rand(uv + vec2(39.13, -12.592))) * (boundsMax - boundsMin) + vec2(boundsMin);
        position = randPosition(uv, iGlobalTime);
    }

    // velocity = randomizeVelocity(uv);

    vec2 force = position * VELOCITY_POSITION_SCALAR;
    // force.y -= sin(iGlobalTime * Y_VELOCITY_WAVE_TIMESCALAR) * Y_VELOCITY_WAVE_AMPLITUDESCALAR;
    force = vec2(0.);

    float pixelValue = texture2D(foreground, vec2(position.x, 1. - position.y)).x;
    float movementScalar = 0.1 + pixelValue * 255. / 127.;

    vec2 newVelocity = velocity + force * dt;
    vec2 newPosition = position + velocity * dt * movementScalar;

    if (clamp(newPosition, boundsMin, boundsMax) != newPosition) {
        // clamping did something, we're out of bounds, reset
        newPosition = randPosition(uv, iGlobalTime);
        newVelocity = vec2(0.);
        // newPosition = vec2(0.);
        // newVelocity = randomizeVelocity(uv);
    }

    gl_FragColor = vec4(newPosition, newVelocity);
    // gl_FragColor = vec4(newPosition, vec2(0.));
}