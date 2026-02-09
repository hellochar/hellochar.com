@import ./rand;

void main() {
    gl_FragColor = vec4(
        gl_FragCoord.xy / resolution * 10. - 5.,
        rand(gl_FragCoord.xy * 12.) * 10. - 5.,
        1.
    );
}
