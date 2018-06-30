// Comes from GPUComputationRenderer
// #define resolution vec2( 1024.0, 1024.0 )

// Comes from adding cellStateVariable as a variable dependency in GPUComputationRenderer
// uniform sampler2D cellStateVarible;
// x = height
// y = velocity
// z = accumulated height

// additionally, we get everything from Three's WebGLProgram: https://threejs.org/docs/#api/renderers/webgl/WebGLProgram

uniform float iGlobalTime;
// uniform vec2 iMouse;
uniform vec2 center;
uniform float growAmount;

#define FORCE_CONSTANT 0.25

const vec2 uvOffset = (1. / resolution);


float forceContribution(float height, vec2 uv) {
    vec4 neighborState = texture2D(cellStateVariable, uv);
    float neighborHeight = neighborState.x;

    return (neighborHeight - height);
}

void main() {
    vec2 v_uv = gl_FragCoord.xy / resolution;
    vec4 cellState = texture2D(cellStateVariable, v_uv);
    float height = cellState.x;
    float velocity = cellState.y;
    float accumulatedHeight = cellState.z;

    float aliveAmount = clamp(growAmount + min(0.8, (iGlobalTime - 500.) / 500.) - length(v_uv - center), 0., 1.);

    float force = 0.;
    force += forceContribution(height, v_uv + vec2(-uvOffset.s, -uvOffset.t));
    // force += forceContribution(height, v_uv + vec2(-uvOffset.s, 0.));
    force += forceContribution(height, v_uv + vec2(-uvOffset.s, +uvOffset.t));
    // force += forceContribution(height, v_uv + vec2(0., -uvOffset.t));
    // force += forceContribution(height, v_uv + vec2(0., 0.));
    // force += forceContribution(height, v_uv + vec2(0., +uvOffset.t));
    force += forceContribution(height, v_uv + vec2(+uvOffset.s, -uvOffset.t));
    // force += forceContribution(height, v_uv + vec2(+uvOffset.s, 0.));
    force += forceContribution(height, v_uv + vec2(+uvOffset.s, +uvOffset.t));
    force *= FORCE_CONSTANT;

    // THIS SHIT MAKES IT GO CRAZY and leave a slime trail! looks really cool
    // force *= aliveAmount;

    velocity += force;
    // velocity *= 0.98718;
    velocity *= 0.99818;

    height += velocity;
    height *= 0.9999;

    // vec2 center = vec2(0.5) + iMouse * 0.50 * vec2(2., 1.);
    if (length(v_uv - center) < length(uvOffset) * 2.) {
        float amount = clamp(1. / (1. + pow(length(v_uv - center) / length(uvOffset), 2.)), 0., 1.);
    // if (length(v_uv - (iMouse + vec2(1.)) / 2.) < length(uvOffset) * 1.) {
        // height = sin(iGlobalTime);
        height = mix(height, 2. * sin(iGlobalTime), amount);
    }

    height *= aliveAmount;
    velocity *= aliveAmount;

    accumulatedHeight *= 0.999;
    accumulatedHeight += height;

    vec4 newCellState = vec4(height, velocity, accumulatedHeight, cellState.w);
    gl_FragColor = newCellState;
}
