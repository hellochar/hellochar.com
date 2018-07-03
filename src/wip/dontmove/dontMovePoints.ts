import { BufferAttribute, BufferGeometry, Points, ShaderMaterial } from "three";

export class DontMovePoints extends Points {
    public material!: ShaderMaterial;
    constructor(sideLength: number, opacity: number, pointSize: number) {
        const geometry = new BufferGeometry();
        const numElements = sideLength * sideLength;
        const positions = new Float32Array(numElements * 3); // leave this empty, we don't use it
        const uvs = new Float32Array(numElements * 2);
        for (let i = 0; i < sideLength; i++) {
            for (let j = 0; j < sideLength; j++) {
                const index = (j * sideLength + i) * 2;
                uvs[index] = i / (sideLength - 1);
                uvs[index + 1] = j / (sideLength - 1);
            }
        }
        geometry.addAttribute("position", new BufferAttribute(positions, 3));
        geometry.addAttribute("uv", new BufferAttribute(uvs, 2));

        super(geometry, makeMaterial(opacity, pointSize));
    }
}

function makeMaterial(opacity: number, pointSize: number) {
    return new ShaderMaterial({
        uniforms: {
            stateVariable: { value: null },
            foreground: { value: null },
        },
        transparent: true,
        fragmentShader: `
uniform sampler2D foreground;
varying vec2 v_position;

void main() {
    vec2 uvFromPosition = v_position.xy + vec2(0.5);
    uvFromPosition.y = 1. - uvFromPosition.y;
    vec3 col = vec3(.99, .96, 1.);
    // col *= (vec3(1.) - texture2D(foreground, uvFromPosition).rgb);
    gl_FragColor = vec4(col, ${opacity.toFixed(2)});
}
`,
        vertexShader: `
uniform sampler2D stateVariable;
varying vec2 v_position;

void main() {
    vec4 state = texture2D(stateVariable, uv);
    vec2 position = state.xy;
    v_position = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vec3(position, 0.), 1.0);
    // gl_PointSize = 30. / length(cameraPosition - worldPosition.xyz);
    gl_PointSize = ${pointSize.toFixed(1)};
}
`,
    });

}
