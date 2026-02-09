uniform float u_time;
uniform vec2 u_mouse;

void main() {
    vec2 v_uv = gl_FragCoord.xy / resolution;
    vec3 myPosition = texture2D(positions, v_uv).xyz;
    vec3 force = vec3(0.);
    float sinDist = .001 + u_mouse.x / 300.;
    float attractPow = u_mouse.y / 3000.;
    for(int x = 0; x < 64; x++) {
        for(int y = 0; y < 64; y++) {
            vec2 uv = vec2(float(x) + 0.5, float(y) + 0.5) / resolution;
            vec3 otherPosition = texture2D(positions, uv).xyz;

            vec3 dist = otherPosition - myPosition;
            float len = length(dist);
            float mag2 = len * len;
            if (mag2 > 0.) {
                float attractFactor = attractPow * sin(len / sinDist) / mag2;
                vec3 dForce = normalize(dist) * attractFactor;
                force += dForce;

                float mag4 = mag2 * mag2;
                vec3 repelForce = -0.01 * normalize(dist) / (mag2 * len);
                force += repelForce;
            }
        }
    }
    myPosition += force * 0.0002;
    if (length(myPosition) < 10.) {
        gl_FragColor = vec4(myPosition, 1.);
    } else {
        float speed = length(force);
        gl_FragColor = vec4(normalize(myPosition) * 5., speed);
    }
}
