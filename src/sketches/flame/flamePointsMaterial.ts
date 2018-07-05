import * as THREE from "three";

export class FlamePointsMaterial extends THREE.ShaderMaterial {
    public map: THREE.Texture;

    private static uniforms = {
        focalLength: {
            value: 1.4,
        } as THREE.IUniform,
    };

    constructor() {
        super({
            vertexColors: THREE.VertexColors,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib.points,
                THREE.UniformsLib.fog,
                FlamePointsMaterial.uniforms,
            ]),
            vertexShader,
            fragmentShader,
        });
        const texture = new THREE.Texture();

        // trigger three's WebGLPrograms.getParameters() to recognize this has a texture
        this.map = texture;
        this.uniforms.map.value = texture;

        const loader = new THREE.ImageLoader(THREE.DefaultLoadingManager);
        loader.setCrossOrigin('Anonymous');
        loader.load("/assets/sketches/disc.png", (image) => {
            texture.image = image;
            texture.format = THREE.RGBAFormat;
            texture.needsUpdate = true;
        });
    }

    public setFocalLength(length: number) {
        this.uniforms.focalLength.value = length;
    }
}

const vertexShader = `
uniform float size;
uniform float scale;
uniform float focalLength;
varying float opacityScalar;

#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <color_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>

    float dist = -mvPosition.z;
    float originalSize = 2.0;
    float outOfFocusAmount = pow(abs(dist - focalLength) / focalLength, 2.) * 3.;
    float unfocusedSize = originalSize * (1. + outOfFocusAmount);

    gl_PointSize = unfocusedSize * ( scale / - mvPosition.z );
    gl_PointSize = min(50., gl_PointSize);

    opacityScalar = 1. / pow(1. + outOfFocusAmount, 2.);

	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>

}
`;

const fragmentShader = `
uniform vec3 diffuse;
uniform float opacity;
varying float opacityScalar;

#include <common>
#include <packing>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <fog_pars_fragment>
#include <shadowmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	#include <clipping_planes_fragment>

	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );

	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>

	outgoingLight = diffuseColor.rgb;

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );

	#include <premultiplied_alpha_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
    #include <fog_fragment>

    gl_FragColor.a *= opacityScalar;
    gl_FragColor.a = max(gl_FragColor.a, 1. / 255.);

    gl_FragColor = pow(gl_FragColor, vec4(0.545));
}
`;
