
uniform vec2 cellStateResolution; // e.g. 1024 x 1024
#define cellOffset (1. / cellStateResolution)

uniform vec2 resolution;

// x = height
// y = velocity
// z = accumulated height
uniform sampler2D cellStateVariable;

uniform float skewIntensity;

// https://github.com/hughsk/glsl-hsv2rgb/blob/master/index.glsl
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// vec2 grad(vec2 uv) {
//     return vec2(
//         (
//             texture2D(cellStateVariable, uv + vec2(cellOffset.s, 0.)).x - 
//             texture2D(cellStateVariable, uv - vec2(cellOffset.s, 0.)).x
//         ) / (2. * cellOffset.s),

//         (
//             texture2D(cellStateVariable, uv + vec2(0., cellOffset.t)).x - 
//             texture2D(cellStateVariable, uv - vec2(0., cellOffset.t)).x
//         ) / (2. * cellOffset.t)
//     );
// }

vec4 diffX(vec2 uv) {
    return 
        (
            abs(texture2D(cellStateVariable, uv + vec2(cellOffset.s, 0.))) - 
            abs(texture2D(cellStateVariable, uv - vec2(cellOffset.s, 0.)))
        ) / (2. * cellOffset.s);
}

vec4 diffY(vec2 uv) {
    return
        (
            abs(texture2D(cellStateVariable, uv + vec2(0., cellOffset.t))) - 
            abs(texture2D(cellStateVariable, uv - vec2(0., cellOffset.t)))
        ) / (2. * cellOffset.t);
}

vec3 color(vec2 uv) {
    vec4 cellState = texture2D(cellStateVariable, uv);
    float height = cellState.x;
    float velocity = cellState.y;
    float accumulatedHeight = cellState.z;

    vec4 dx = diffX(uv);
    vec4 dy = diffY(uv);
    // vec2 gradY = vec2(dy.x, dy.x);
    vec2 gradY = vec2(dy.z, dy.z);
    vec2 gradAccHeight = vec2(dx.z, dy.z);
    vec3 normY = normalize(vec3(gradY, 1.));

    vec3 norm = normalize(vec3(dx.x, dy.x, 1.));
    // vec3 normY = normalize(vec3(gradAccHeight, 1.));

    float phong1 = pow(max(0., dot(norm, normalize(vec3(-1., -1., 0.3)))), 30.) * 0.6;
    float phong2 = pow(max(0., dot(norm, normalize(vec3(-0.7, -1., 0.4)))), 12.) * 0.3;
    
    float gradYFactor = clamp(1.1 - length(gradY) / 9., 0., 1.);
    float gradAccFactor = length(gradAccHeight) / 100.;
    float heightFactor = abs(height) * 3.;

    vec3 col = vec3(4., 32., 55.);
    // col = mix(col, vec3(235., 89., 56.), gradAccFactor);
    vec3 baseRed = vec3(235., 89., 56.);
    // vec3 bodyColor = mix(baseRed, hsv2rgb(vec3(mod(accumulatedHeight / 10., 1.), 1., 0.5 + skewIntensity * 0.25)) * 255., skewIntensity);
    vec3 bodyColor = mix(baseRed, vec3(255.), skewIntensity);
    col = mix(col, bodyColor, heightFactor);
    // col += vec3(48., 161., 184.) * gradYFactor;
    col += phong1 * vec3(254., 253., 255.);
    col += phong2 * vec3(170., 89., 57.);
    return clamp(col / 255., vec3(0.), vec3(1.));
}

float udRoundBox( vec2 uv, vec2 boxDimensions, float radius )
{
  return length(max(abs(uv)-boxDimensions,0.0))-radius;
}


void main() {
    vec2 screenCoord = gl_FragCoord.xy / resolution - vec2(0.5);
    vec2 normCoord;
    vec2 uv;

    vec3 col;
    float aspectRatio = resolution.x / resolution.y;
    vec3 cymaticsColor;
    if (aspectRatio > 1.0) {
        normCoord = screenCoord * vec2(aspectRatio, 1.);
        uv = normCoord + vec2(1.0, 0.5);
        cymaticsColor = color(uv);
    } else {
        normCoord = screenCoord * vec2(1., 1. / aspectRatio);
        uv = normCoord + vec2(0.5, 1.0);
        cymaticsColor = color(uv);
    }

    // float vignetteAmount = pow(smoothstep(0., 0.5, length(normCoord)), 25.0);
    float vignetteAmount = 1. - clamp(-udRoundBox(screenCoord, vec2(0.45), 0.05) * 40., 0., 1.);
    // float vignetteAmount = 0.;
    // vec3 colBg = vec3(0.25 - length(normCoord) * 0.2);
    vec3 colBg = vec3(0.25 - length(normCoord) * 0.2);
    col = mix(pow(cymaticsColor, vec3(mix(0.8, 1., vignetteAmount))), colBg, vignetteAmount);

    gl_FragColor = vec4(col, 1.0);
}

