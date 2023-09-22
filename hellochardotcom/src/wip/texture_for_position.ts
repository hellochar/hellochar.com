import * as React from "react";
import * as THREE from "three";

import devlog from "../common/devlog";
import { ISketch, SketchAudioContext } from "../sketch";

// goal - use a shader to fill in a texture, which is then used to fill in the positions of particles

const COMPUTE_TEXTURE_SIDE_LENGTH = 1024;

class TextureForPosition extends ISketch {
    public scene = new THREE.Scene();

    public camera!: THREE.PerspectiveCamera;
    public controls!: THREE.OrbitControls;
    public pointsMaterial!: THREE.ShaderMaterial;

    public init() {
        this.camera = new THREE.PerspectiveCamera(60, 1 / this.aspectRatio, 0.01, 1000);
        this.camera.position.z = 10;
        this.camera.position.y = 4;
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 2;
        // AND NOW, WE CREATE A TEXTURE WHERE EACH PIXEL HOLDS 4 FLOATING POINT NUMBERS WITH ACTUAL 32 BIT PRECISION
        const numElements = COMPUTE_TEXTURE_SIDE_LENGTH * COMPUTE_TEXTURE_SIDE_LENGTH;

        const randomNoiseShader = new THREE.ShaderMaterial({
            fragmentShader: `
float rand(vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    gl_FragColor = vec4(gl_FragCoord.xy / ${COMPUTE_TEXTURE_SIDE_LENGTH.toFixed(1)} * 10. - 5., rand(gl_FragCoord.xy * 12.) * 10. - 5., 1.);
}
`,
            vertexShader: `
void main() {
    gl_Position = vec4(position, 1.0);
}
`,
side: THREE.DoubleSide,
        });

        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -5, 5);
        camera.position.z = 1;
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        const scene = new THREE.Scene();
        const mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), randomNoiseShader);
        scene.add(mesh);

        // render random initial data into pingpong's initial textures
        this.renderer.render(scene, camera, this.pingPong.currentTarget);
        // logRenderTarget(renderTarget);

        // ok great now we have a texture with position information. now we feed this into a vert that uses that texture in computing gl_Position
        // the goal here is transforming positionTexture -> points on screen
        this.pointsMaterial = new THREE.ShaderMaterial({
            transparent: true,
            fragmentShader: `
void main() {
    gl_FragColor = vec4(0.9, 0.6, 0.6, 0.5);
}
            `,
            vertexShader: `
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

void main() {
    // extract this point's position from the texture. We fill in the .uv coord
    vec4 worldPosition = texture2D(positionTexture, uv);
    gl_Position = projectionMatrix * modelViewMatrix * worldPosition;
    gl_PointSize = 3. / length(cameraPosition - worldPosition.xyz);
}
`,
        });
        this.pointsMaterial.uniforms.positionTexture = {
            // value: renderTarget.texture,
            value: null,
        };

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(numElements * 3); // leave this empty, we don't use it
        const uvs = new Float32Array(numElements * 2);
        for (let i = 0; i < COMPUTE_TEXTURE_SIDE_LENGTH; i++) {
            for (let j = 0; j < COMPUTE_TEXTURE_SIDE_LENGTH; j++) {
                const index = (j * COMPUTE_TEXTURE_SIDE_LENGTH + i) * 2;
                uvs[index] = i / (COMPUTE_TEXTURE_SIDE_LENGTH - 1);
                uvs[index + 1] = j / (COMPUTE_TEXTURE_SIDE_LENGTH - 1);
            }
        }
        geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.addAttribute("uv", new THREE.BufferAttribute(uvs, 2));

        // FUCK yes we've properly connected texture -> points
        const points = new THREE.Points(geometry, this.pointsMaterial);
        this.scene.add(points);
        this.scene.add(new THREE.AxesHelper());

        // do it once just to warm it up
        this.iteratePingPong();
    }

    // ok now, ping-pong two render targets to continuously feed into each other and also into the positions.
    pingPong = (() => {
        const target1 = new THREE.WebGLRenderTarget(COMPUTE_TEXTURE_SIDE_LENGTH, COMPUTE_TEXTURE_SIDE_LENGTH, {
            type: THREE.FloatType,
            format: THREE.RGBAFormat,
            depthBuffer: false,
            stencilBuffer: false,
        });
        const target2 = new THREE.WebGLRenderTarget(COMPUTE_TEXTURE_SIDE_LENGTH, COMPUTE_TEXTURE_SIDE_LENGTH, {
            type: THREE.FloatType,
            format: THREE.RGBAFormat,
            depthBuffer: false,
            stencilBuffer: false,
        });
        const currentTarget = target1;

        const positionShader = new THREE.ShaderMaterial({
            fragmentShader:
`
uniform float u_time;
uniform sampler2D positions;
varying vec2 v_uv;

// taken from https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v,
    out vec3 p0, out vec3 p1, out vec3 p2, out vec3 p3,
    out vec3 x0, out vec3 x1, out vec3 x2, out vec3 x3
) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C
  x1 = x0 - i1 + 1.0 * C.xxx;
  x2 = x0 - i2 + 2.0 * C.xxx;
  x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 );
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  p0 = vec3(a0.xy,h.x);
  p1 = vec3(a0.zw,h.y);
  p2 = vec3(a1.xy,h.z);
  p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}

void main() {
    vec3 position = texture2D(positions, v_uv).xyz;
    vec3 p0, p1, p2, p3, x0, x1, x2, x3;
    for (int i = 0; i < 3; i++) {
        float noise = snoise(position * 1.6, p0, p1, p2, p3, x0, x1, x2, x3);
        // vec3 offset = mix(p0, p1, (sin(u_time / 100.) + 1.) / 2.);
        // vec3 offset = p0 * x0 + p1 * x1 + p2 * x2 + p3 * x3;
        vec3 offset = p0 + p1 + p2 + p3;
        vec3 newPosition = position + offset / 100.;
        position = newPosition;
    }
    gl_FragColor = vec4(position, 1.);
}
`,
            vertexShader: // we just want a passthrough here
`
varying vec2 v_uv;

void main() {
    gl_Position = vec4(position, 1.);
    v_uv = uv;
}
`,
        });
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -5, 5);
        camera.position.z = 1;
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        const scene = new THREE.Scene();
        const mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), positionShader);
        scene.add(mesh);

        return {
            target1,
            target2,
            scene,
            camera,
            currentTarget,
            positionShader,
        };
    })();

    public iteratePingPong() {
        const { camera, currentTarget, positionShader, scene, target1, target2 } = this.pingPong;
        const nextTarget = currentTarget === target1 ? target2 : target1;
        // set it up to render from target1, into target2
        positionShader.uniforms.positions = {
            value: currentTarget.texture,
        };
        positionShader.uniforms.u_time = {
            value: performance.now(),
        };
        // do the render, now target2 is the latest
        this.renderer.render(scene, camera, nextTarget);
        this.pingPong.currentTarget = nextTarget;
        // we also have to hook up nextTarget to the final position
        this.pointsMaterial.uniforms.positionTexture.value = nextTarget.texture;
    }

    // assumes target is rgbaformat
    public logRenderTarget(renderTarget: THREE.WebGLRenderTarget) {
        const buffer = new Float32Array(renderTarget.width * renderTarget.height * 4);
        this.renderer.readRenderTargetPixels(renderTarget, 0, 0, renderTarget.width, renderTarget.height, buffer);
        devlog(buffer);
    }

    get aspectRatio() {
        return this.renderer.domElement.height / this.renderer.domElement.width;
    }

    public animate() {
        if (performance.now() > 5000) {
            this.iteratePingPong();
        }
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

export default TextureForPosition;
