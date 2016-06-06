(function () {
    var audioContext;
    var renderer;

    var camera;
    var geometry;
    var scene;
    var mesh;
    var texture, video, material;

    function init(_renderer, _audioContext) {
        renderer = _renderer;
        audioContext = _audioContext;

        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 100);
        camera.position.z = -1;
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        video = $("<video autoplay><video>")[0];
        texture = new THREE.Texture(video);

        geometry = new THREE.PlaneGeometry(2, 2);
        material = new THREE.ShaderMaterial({
            uniforms: {
                texture: { type: 't', value: texture },
                time: { type: 'f', value: 0.0 },
                iMouse: { type: 'v2', value: new THREE.Vector2(0, 0) }
            },

            vertexShader: [
                "varying vec2 vPosition;",
                "varying vec2 vUv;",

                "void main() {",
                "   vUv = uv;",
                "   vPosition = position.xy;",
                "   gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
                "}"
            ].join("\n"),

            fragmentShader: [
                "varying vec2 vPosition;",
                "varying vec2 vUv;",
                "uniform sampler2D texture;",
                "uniform vec2 iMouse;",
                "uniform float time;",

                "const int MAX_ITERATIONS = 4;",
                "const float ESCAPE_BOUNDARY = 4.0;",

                "vec2 multComplex(vec2 a, vec2 b) {",
                "    return vec2(a.x*b.x - a.y*b.y, 2.0*a.x*b.y);",
                "}",

                "vec4 palette(float i, vec2 c) {",
                "    if( length(c) < 1.0) c = 1.0 / c;",
                "    vec4 sample = texture2D(texture, mod(sin(c + vec2(time / 15.0)), 1.0));",
                "    sample *= pow(i, 3.0);",
                "    return sample;",
                "}",

                "// N is escape iteration",
                "// p is z exponent (probably 2)",
                "// z is the final iteration position",
                "float smoothIterationCount(int N, float p, vec2 z) {",
                "    if (N < MAX_ITERATIONS) {",
                "       return float(N) + 1.0 + (1.0 / log(p)) * log( log(ESCAPE_BOUNDARY) / log(length(z)) );",
                "    } else {",
                "        return float(MAX_ITERATIONS);",
                "    }",
                "}",

                "void main() {",
                "    vec2 extent = vec2(1.5, 1.5);",

                "    vec2 center = vec2(0, 0);",
                "    vec2 z = vPosition * extent;",
                "    vec2 c = iMouse * 1.0;",
                "    float M = 4.0;",

                "    int i = 0;",
                "    for(int ii = 0; ii < MAX_ITERATIONS; ii++) {",
                "        z = multComplex(z, z) + multComplex(z, c) + c;",

                "        if(length(z) > M) break;",
                "        i = ii + 1;",
                "    }",
                "    float smoothcolor = smoothIterationCount(i, 2.0, z);",
                "    gl_FragColor = palette(smoothcolor / float(MAX_ITERATIONS), z);",
                "}",

            ].join("\n"),
            side: THREE.DoubleSide
        });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        var errorCallback = function(e) {
            console.log('Reeeejected!', e);
        };

        var constraints = {
            video: {
                mandatory: {
                    minWidth: 800,
                    minHeight: 600
                }
            }
        };
        navigator.webkitGetUserMedia(constraints, function(localMediaStream) {
            video.src = window.URL.createObjectURL(localMediaStream);
            video.onloadedmetadata = function() {
                material.map = texture;
                material.needsUpdate = true;
            };
        }, errorCallback);
    }

    function animate(millisElapsed) {
        if ( video.readyState === video.HAVE_ENOUGH_DATA ) {
            texture.needsUpdate = true;
        }
        material.uniforms.time.value += millisElapsed / 1000;
        renderer.render(scene, camera);
    }

    function touchstart(event) {
    }

    function touchmove(event) {
    }

    function touchend(event) {
    }

    function mousedown(event) {
    }

    function mousemove(event) {
        mouseX = event.offsetX == undefined ? event.originalEvent.layerX : event.offsetX;
        mouseY = event.offsetY == undefined ? event.originalEvent.layerY : event.offsetY;
        material.uniforms.iMouse.value.set(Math.map(mouseX, 0, renderer.domElement.width, -1, 1),
                                           Math.map(mouseY, 0, renderer.domElement.height, 1, -1));
    }

    function mouseup(event) {
    }

    function resize(width, height) {
    }

    var webcam = {
        id: "webcam",
        init: init,
        instructions: "Click, drag, look, listen.",
        animate: animate,
        mousedown: mousedown,
        mousemove: mousemove,
        mouseup: mouseup,
        resize: resize,
        touchstart: touchstart,
        touchmove: touchmove,
        touchend: touchend
    };
    window.registerSketch(webcam);
})();

