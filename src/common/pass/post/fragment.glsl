uniform float time;
uniform sampler2D tDiffuse;
varying vec2 vTextureCoord;

// https://github.com/armory3d/armory/blob/master/Shaders/std/tonemap.glsl

float vignette() {
    // https://github.com/mattdesl/lwjgl-basics/wiki/ShaderLesson3
    vec2 position = vTextureCoord - vec2(0.5);

    //determine the vector length of the center position
    float len = length(position);

    //use smoothstep to create a smooth vignette
    float RADIUS = 0.75;
    float SOFTNESS = 0.45;
    float vignette = smoothstep(RADIUS, RADIUS-SOFTNESS, len);

    return vignette;
}

vec2 barrelDistortion(vec2 coord, float amt) {
    vec2 cc = coord - 0.5;
    float dist = dot(cc, cc);
    return coord + cc * dist * amt;
}

float sat( float t )
{
    return clamp( t, 0.0, 1.0 );
}

float linterp( float t ) {
    return sat( 1.0 - abs( 2.0*t - 1.0 ) );
}

float remap( float t, float a, float b ) {
    return sat( (t - a) / (b - a) );
}

vec4 spectrum_offset( float t ) {
    vec4 ret;
    float lo = step(t,0.5);
    float hi = 1.0-lo;
    float w = linterp( remap( t, 1.0/6.0, 5.0/6.0 ) );
    ret = vec4(lo,1.0,hi, 1.) * vec4(1.0-w, w, 1.0-w, 1.);

    return pow( ret, vec4(1.0/2.2) );
}

vec3 chromaticAbberation() {
    const float max_distort = 0.3;
    const int num_iter = 12;
    const float reci_num_iter_f = 1.0 / float(num_iter);

    vec2 uv=(vTextureCoord*.8)+.10;
    /* vec2 uv = vTextureCoord.xy; */

    vec4 sumcol = vec4(0.0);
    vec4 sumw = vec4(0.0);
    for ( int i=0; i<num_iter;++i )
    {
        float t = float(i) * reci_num_iter_f;
        vec4 w = spectrum_offset( t );
        sumw += w;
        vec4 tex = texture2D( tDiffuse, barrelDistortion(uv, .6 * max_distort*t ) );
        // move from linear to lightspace
        // tex = vec4(log(1.0 + tex.rgb * 255.), 1.0);
        sumcol += w * tex;
    }

    return (sumcol / sumw).rgb;
}

float random(vec2 n, float offset ){
    return .5 - fract(sin(dot(n.xy + vec2(offset, 0.), vec2(12.9898, 78.233)))* 43758.5453);
}

void main(void) {
    // chromatic abberation
    vec3 totalColor = chromaticAbberation();

    // bit of vignetting
    float vignetteAmount = vignette();
    totalColor = mix(totalColor, totalColor * vignetteAmount, 0.5);

    // noise
    totalColor += 0.025 * random(vTextureCoord, 1. + time * 0.001);

    // totalColor = pow(totalColor, vec3(0.45));

    gl_FragColor = vec4(totalColor, 1.0);
}