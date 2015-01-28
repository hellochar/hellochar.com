GravityShader = {
    uniforms: {
        iGlobalTime: { type: 'f', value: 0 },
        iMouse:      { type: 'v2', value: new THREE.Vector2(0, 0) },
        iResolution: { type: 'v2', value: new THREE.Vector2(100, 100) },
        G:           { type: 'f', value: 0 },
        tDiffuse:    { type: 't', value: null }
    },

    vertexShader: [
        "varying vec2 vTextureCoord;",
        "void main() {",
            "vTextureCoord = uv;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
        "}"
    ].join("\n"),

    fragmentShader: [
        "uniform float iGlobalTime;",
        "uniform vec2 iMouse;",
        "uniform vec2 iResolution;",
        "uniform sampler2D tDiffuse;",
        "varying vec2 vTextureCoord;",
        "uniform float G;",

        "vec2 gravity(vec2 p, vec2 m, float g) {",
        "    float mass1 = 1.0;",
        "    float mass2 = 1.0;",
        "    ",
        "    return (m - p) * g * mass1 * mass2 / pow(length(p - m), 2.0);",
        "}",

        "vec4 equality(vec2 p, vec2 m) {",
        "    float total = 0.0;",
        "    vec2 incomingP = p;",
        "    vec2 outgoingP = p;",
        "    vec4 c = vec4(0.0);",
        "    float colorBias = 0.93;",
        "    vec4 outgoingColorFactor = vec4(colorBias, 1.0, 1.0 / colorBias, 1.0);",
        "    vec4 incomingColorFactor = vec4(1.0 / colorBias, 1.0, colorBias, 1.0);",
        "    for( float i = 1.0; i < 12.0; i += 1.0) {",
        "       incomingP = incomingP - gravity(incomingP, m, G);",
        "       outgoingP = outgoingP + gravity(outgoingP, m, G * 2.0);",
        "       c += texture2D(tDiffuse, incomingP / iResolution) / (i*i + 4.8) * pow(incomingColorFactor, vec4(i));",
        "       c += texture2D(tDiffuse, outgoingP / iResolution) / (i*i + 4.8) * pow(outgoingColorFactor, vec4(i));",
        "    }",
        "    return c;",
        "}",

        "void main(void)",
        "{",
        "    vec2 uv = gl_FragCoord.xy;",
        "    vec2 uvM = iMouse.xy;",
        "    vec4 c = texture2D(tDiffuse, vTextureCoord);",
        "    vec4 c2 = equality(uv, uvM);",
        "    gl_FragColor = pow(c + c2, vec4(5.0/6.0));",
        "}"
    ].join("\n")
}
