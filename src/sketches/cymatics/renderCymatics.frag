
uniform vec2 cellStateResolution; // e.g. 1024 x 1024
#define cellOffset (1. / cellStateResolution)

uniform vec2 resolution;

// x = height
// y = velocity
// z = accumulated height
uniform sampler2D cellStateVariable;

// https://github.com/hughsk/glsl-hsv2rgb/blob/master/index.glsl
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec2 grad(vec2 uv) {
    return vec2(
        (
            texture2D(cellStateVariable, uv + vec2(cellOffset.s, 0.)).x - 
            texture2D(cellStateVariable, uv - vec2(cellOffset.s, 0.)).x
        ) / (2. * cellOffset.s),

        (
            texture2D(cellStateVariable, uv + vec2(0., cellOffset.t)).x - 
            texture2D(cellStateVariable, uv - vec2(0., cellOffset.t)).x
        ) / (2. * cellOffset.t)
    );
}

vec3 color(vec2 uv) {
    vec4 cellState = texture2D(cellStateVariable, uv);
    float height = cellState.x;
    float velocity = cellState.y;
    float accumulatedHeight = cellState.z;

    // vec2 grad = grad(uv);
    vec3 col;
    // col = hsv2rgb(vec3(height, 1. - clamp(abs(velocity), 0., 1.), clamp(1.0 - length(accumulatedHeight) / 10., 0., 1.)));
    // col = hsv2rgb(vec3(abs(accumulatedHeight), 1. - clamp(abs(velocity), 0., 1.), clamp(abs(height * 4.), 0., 1.)));
    // col = vec3(clamp(height * 14., -0.5, 0.5) + 0.5);
    col = vec3(1.1 - length(grad(uv)) / 4.);
    return col;
}

float udRoundBox( vec2 uv, vec2 boxDimensions, float radius )
{
  return length(max(abs(uv)-boxDimensions,0.0))-radius;
}


void main() {
    float aspectRatio = resolution.x / resolution.y;
    vec2 screenCoord = gl_FragCoord.xy / resolution - vec2(0.5);
    vec2 normCoord = screenCoord * vec2(aspectRatio, 1.);
    vec2 uv = normCoord + vec2(0.5);
    vec3 col;

    // if (uv.x < 0. || uv.x > 1.) {
        // col = vec3(0.25 - length(normCoord) * 0.2);
        // float adjustedX = normCoord.x / aspectRatio;
        // vec3 color2 = color(vec2(adjustedX, normCoord.y));
        // col = color2 * colBase + vec3(0.25);
    //     col = vec3(0.);
    // } else {
        vec3 cymaticsColor = color(uv + vec2(0.5, 0.));
        // float vignetteAmount = pow(smoothstep(0., 0.5, length(normCoord)), 25.0);
        float vignetteAmount = 1. - clamp(-udRoundBox(screenCoord, vec2(0.45), 0.05) * 40., 0., 1.);
        // float vignetteAmount = 0.;
        vec3 colBg = vec3(0.25 - length(normCoord) * 0.2);
        col = mix(pow(cymaticsColor, vec3(mix(0.8, 1., vignetteAmount))), colBg, vignetteAmount);
    // }

    // col = vec3(-udRoundBox(screenCoord, vec2(0.45), 0.05) * 40.);

    gl_FragColor = vec4(col, 1.0);
}

