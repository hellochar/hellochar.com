function ExplodeFilter() {
    PIXI.AbstractFilter.call(this);
    this.passes = [this];

    this.uniforms = {
        // the pixel that was originally this much farther away will now be put here
        // > 1 means that the picture shrinks in
        // [0..1] means that the picture expands outwards
        shrinkFactor: {type: '1f', value: 0.99},
        iMouse: {type: '2f', value: {x: 0.0, y: 0.0}},
        iResolution: {type: '2f', value: {x: 100, y: 100}}
    };
    this.fragmentSrc = [
        "precision mediump float;",
        "uniform sampler2D uSampler;",
        "varying vec2 vTextureCoord;",
        "uniform vec2 iMouse;",
        "uniform vec2 iResolution;",
        "uniform float shrinkFactor;",

        "vec4 explodedTexture2D(vec2 center, float shrink) {",
        "    vec2 offset = vTextureCoord.xy - center;",
        "    vec2 samplePosition = center + normalize(offset) * length(offset) * shrink;",
        "    vec4 textureCol = texture2D(uSampler, samplePosition);",
        "    textureCol += texture2D(uSampler, samplePosition + vec2(2.0, 0.0) / iResolution);",
        "    textureCol += texture2D(uSampler, samplePosition + vec2(-2.0, 0.0) / iResolution);",
        "    textureCol += texture2D(uSampler, samplePosition + vec2(0.0, 2.0) / iResolution);",
        "    textureCol += texture2D(uSampler, samplePosition + vec2(0.0, -2.0) / iResolution);",
        "    if (samplePosition.x < 0.0 || samplePosition.x >= 1.0 ||",
        "        samplePosition.y < 0.0 || samplePosition.y >= 1.0) {",
        "       return vec4(0.0);",
        "    } else {",
        "      return textureCol;",
        "    }",
        "}",

        "mat2 m2 = mat2(1.6,-1.2,1.2,1.6);",

        "void main(void)",
        "{",
        "    vec2 center = iMouse;",
        "    vec4 col = vec4(0.0);",
        "    float shrink = 1.0;",
        "    for( float i = 0.0; i < 5.0; i += 1.0) {",
        "        col.r += explodedTexture2D(center, shrink).r / (i + 1.0);",
        "        shrink *= shrinkFactor;",
        "        col.g += explodedTexture2D(center, shrink).g / (i + 1.0);",
        "        shrink *= shrinkFactor;",
        "        col.b += explodedTexture2D(center, shrink).b / (i + 1.0);",
        "        shrink *= shrinkFactor;",
        "        center = m2*center*0.0928;",
        "    }",
        "    gl_FragColor = col;",
        "}"
    ];
}
ExplodeFilter.prototype = Object.create( PIXI.AbstractFilter.prototype );
ExplodeFilter.prototype.constructor = ExplodeFilter;
ExplodeFilter.prototype.set = function(varName, value) {
    this.dirty = true;
    this.uniforms[varName].value = value;
}

