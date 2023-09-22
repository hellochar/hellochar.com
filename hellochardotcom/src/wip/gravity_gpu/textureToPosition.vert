// // default vertex attributes provided by Geometry and BufferGeometry
// attribute vec3 position;
// attribute vec3 normal;
// attribute vec2 uv;
// attribute vec2 uv2;

// // stuff provided by THREE
// // = object.matrixWorld
// uniform mat4 modelMatrix;

// // = camera.matrixWorldInverse * object.matrixWorld
// uniform mat4 modelViewMatrix;

// // = camera.projectionMatrix
// uniform mat4 projectionMatrix;

// // = camera.matrixWorldInverse
// uniform mat4 viewMatrix;

// // = inverse transpose of modelViewMatrix
// uniform mat3 normalMatrix;

// // = camera position in world space
// uniform vec3 cameraPosition;

uniform sampler2D positionTexture;
varying float v_speed;

void main() {
    // extract this point's position from the texture. We fill in the .uv coord
    vec4 texel = texture2D(positionTexture, uv);
    vec3 worldPosition = texel.xyz;
    v_speed = texel.w;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPosition, 1.0);
    gl_PointSize = 30. / length(cameraPosition - worldPosition.xyz);
}
