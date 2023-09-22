varying vec2 vTextureCoord;

void main() {
    vTextureCoord = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
