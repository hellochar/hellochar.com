import * as THREE from "three";

export const GravityShader = {
    uniforms: {
        gamma:       { type: "f", value: 6.0 / 6.0 },
        iGlobalTime: { type: "f", value: 0 },
        iMouse:      { type: "v2", value: new THREE.Vector2(0, 0) },
        iMouseFactor: { type: "f", value: 1 / 15 },
        iResolution: { type: "v2", value: new THREE.Vector2(100, 100) },
        G:           { type: "f", value: 0 },
        tDiffuse:    { type: "t", value: null },
    },

    vertexShader: [
        "varying vec2 vTextureCoord;",
        "void main() {",
            "vTextureCoord = uv;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
        "}",
    ].join("\n"),

    fragmentShader: [
        "uniform float iGlobalTime;",
        "uniform vec2 iMouse;",
        "uniform float iMouseFactor;",
        "uniform vec2 iResolution;",
        "uniform sampler2D tDiffuse;",
        "varying vec2 vTextureCoord;",
        "uniform float G;",
        "uniform float gamma;",

        "vec2 gravity(vec2 p, vec2 attractionCenter, float g) {",
        "    float mass1 = 1.0;",
        "    float mass2 = 1.0;",
        "    ",
        "    return (attractionCenter - p) * g * mass1 * mass2 / pow(length(p - attractionCenter), 2.0);",
        "}",

        "vec4 equality(vec2 p, vec2 attractionCenter) {",
        "    float total = 0.0;",
        "    vec2 incomingP = p;",
        "    vec2 outgoingP = p;",
        "    vec4 c = vec4(0.0);",
        "    vec4 outgoingColorFactor = vec4(0.96, 1.0, 1.0 / 0.96, 1.0);",
        "    vec4 incomingColorFactor = vec4(1.0 / 0.96, 1.0, 0.96, 1.0);",
        "    for( float i = 1.0; i < 1.0; i += 1.0) {",
        "       incomingP = incomingP - gravity(incomingP, attractionCenter, G);",
        "       outgoingP = outgoingP + gravity(outgoingP, attractionCenter, G);",

        "       incomingP -= (iMouse - p) * iMouseFactor;",
        "       outgoingP += (iMouse - p) * iMouseFactor;",
        "       float intensityScalar = 0.8 / (i + 5. + sqrt(i));",
        "       c += texture2D(tDiffuse, incomingP / iResolution) * intensityScalar * pow(incomingColorFactor, vec4(i));",
        "       c += texture2D(tDiffuse, outgoingP / iResolution) * intensityScalar * pow(outgoingColorFactor, vec4(i));",
        "    }",
        "    return c;",
        "}",

        "void main(void)",
        "{",
        "    vec2 uv = gl_FragCoord.xy;",
        "    vec4 c = texture2D(tDiffuse, vTextureCoord);",
        "    vec4 c2 = equality(uv, iResolution/2.0);",
        "    gl_FragColor = pow(c + c2, vec4(gamma));",
        "}",
    ].join("\n"),
};
