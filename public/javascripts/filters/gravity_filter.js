function GravityFilter() {
    PIXI.AbstractFilter.call(this);
    this.passes = [this];

    this.uniforms = {
        iGlobalTime: {type: '1f', value: 0.0},
        iMouse: {type: '2f', value: {x: 0.0, y: 0.0}},
        iResolution: {type: '2f', value: {x: 100, y: 100}},
        G: {type: '1f', value: 0},
    };
    this.fragmentSrc = [
        "precision mediump float;",
        "uniform float iGlobalTime;",
        "uniform vec2 iMouse;",
        "uniform vec2 iResolution;",
        "uniform sampler2D uSampler;",
        "varying vec2 vTextureCoord;",
        "uniform float G;",

        "vec2 gravity(vec2 p, vec2 m) {",
        "    float mass1 = 1.0;",
        "    float mass2 = 1.0;",
        "    ",
        "    float GRAVITATIONAL_CONSTANT = G;",
        "    return (m - p) * GRAVITATIONAL_CONSTANT * mass1 * mass2 / pow(length(p - m), 2.0);",
        "}",

        "vec2 coolGravity(vec2 p, vec2 m) {",
        "    float angle = atan((p - m).y, (p - m).x);",
        "    return cos(angle * 4.0 + iGlobalTime / 2.0) * gravity(p, m);",
        "}",

        "float horizLine(float y, vec2 p, vec2 m) {",
        "    vec2 horizP = vec2(p.x, y);",
        "    vec2 newP = horizP + gravity(horizP, m);",
        "    return 1.0 / length(newP - p);",
        "}",

        "float vertLine(float x, vec2 p, vec2 m) {",
        "    vec2 vertP = vec2(x, p.y);",
        "    vec2 newP = vertP + gravity(vertP, m);",
        "    return 1.0 / length(newP - p);",
        "}",

        "vec4 equality(vec2 p, vec2 m) {",
        "    float total = 0.0;",
        "    vec2 incomingP = p;",
        "    vec2 outgoingP = p;",
        "    vec4 c = vec4(0.0);",
        "    for( float i = 1.0; i < 10.0; i += 1.0) {",
        "       incomingP = incomingP - gravity(incomingP, m);",
        "       outgoingP = outgoingP + gravity(outgoingP, m);",
        "       c += texture2D(uSampler, incomingP / iResolution) / (i*i + 4.0);",
        "       c += texture2D(uSampler, outgoingP / iResolution) / (i*i + 4.0);",
        "    }",
        "    return c;",
        "}",

        "void main(void)",
        "{",
        "    vec2 uv = gl_FragCoord.xy;",
        "    vec2 uvM = iMouse.xy;",
        "    vec4 c = texture2D(uSampler, vTextureCoord);",
        "    vec4 c2 = equality(uv, uvM);",
        "    gl_FragColor = c + c2;",
        "}"
    ];
}
GravityFilter.prototype = Object.create( PIXI.AbstractFilter.prototype );
GravityFilter.prototype.constructor = GravityFilter;
GravityFilter.prototype.set = function(varName, value) {
    this.dirty = true;
    this.uniforms[varName].value = value;
}
