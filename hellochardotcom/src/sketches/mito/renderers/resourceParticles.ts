import { BufferAttribute, BufferGeometry, Color, Points, PointsMaterial, ShaderMaterial, Texture } from "three";

export class ResourceParticles extends Points {
    static BUFFER_SIZE = 100000;
    public geometry!: BufferGeometry;
    static newGeometry() {
        const geometry = new BufferGeometry();
        const positions = new Float32Array(ResourceParticles.BUFFER_SIZE * 3);
        const sizes = new Float32Array(ResourceParticles.BUFFER_SIZE);
        geometry.addAttribute("position", new BufferAttribute(positions, 3).setDynamic(true));
        geometry.addAttribute("size", new BufferAttribute(sizes, 1).setDynamic(true));
        return geometry;
    }
    constructor(params: MaterialParams) {
        super(ResourceParticles.newGeometry(), new ResourceParticleMaterial(params));
        this.material.depthTest = false;
        this.material.needsUpdate = true;
        this.frustumCulled = false;
    }
    private index = 0;
    startFrame() {
        this.index = 0;
    }
    commit(x: number, y: number, z: number, size: number) {
        this.geometry.attributes.position.setXYZ(this.index, x, y, z);
        this.geometry.attributes.size.setX(this.index, size);
        this.index++;
    }
    endFrame() {
        const positions = (this.geometry.attributes.position as BufferAttribute);
        positions.needsUpdate = true;
        const sizes = (this.geometry.attributes.size as BufferAttribute);
        sizes.needsUpdate = true;
        this.geometry.setDrawRange(0, this.index);
    }
}

export interface MaterialParams {
    opacity: number;
    color: Color;
    size: number;
    map?: Texture;
}

class ResourceParticleMaterial extends ShaderMaterial {
    public map: Texture | undefined;

    constructor(public params: MaterialParams) {
        super({
            uniforms: {
                opacity: { value: params.opacity },
                sizeGlobal: { value: params.size },
                color: { value: params.color },
                // you have to put it here too
                map: { value: params.map },
            },
            vertexShader,
            fragmentShader,
            depthTest: false,
            transparent: true,
        } as any);

        // OH MY GOD you can do this. You have to do this *AFTER* the super call!
        this.map = params.map;
    }
}

const vertexShader = `
attribute float size;
uniform float sizeGlobal;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_PointSize = size * sizeGlobal * -projectionMatrix[1].y;
    gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
uniform vec3 color;
uniform sampler2D texture;
uniform float opacity;

#ifdef USE_MAP
	uniform mat3 uvTransform;
	uniform sampler2D map;
#endif

void main() {
    gl_FragColor = vec4( color, opacity );

    #ifdef USE_MAP
        vec4 mapTexel = texture2D( map, gl_PointCoord );
        gl_FragColor *= mapTexelToLinear( mapTexel );
    #endif
}
`;
