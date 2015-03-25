(function() {

    var TerrainGen = (function() {
        function fract( n ) {
            return n - Math.floor(n);
        }

        function hash( n ) {
            return fract(Math.sin(n)*43758.5453123);
        }

        function mix(a, b, x) {
            return Math.lerp(a, b, x);
        }

        // x = Vector3
        function noise( x ) {
            var p = x.clone().floor();
            var f = x.clone().sub(p);

            // f = f*f*(3.0-2.0*f);

            var n = p.x + p.y*57.0 + 113.0*p.z;

            var res = mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                              mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y),
                          mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                              mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);
            return res;
        }

        // x = Vector2
        function noised( x ) {
            var p = x.clone().floor();
            var f = x.clone().sub(p);

            // var u = f*f*(3.0-2.0*f);
            var u = f;

            var n = p.x + p.y*57.0;

            var a = hash(n+  0.0);
            var b = hash(n+  1.0);
            var c = hash(n+ 57.0);
            var d = hash(n+ 58.0);

            var yz = f.clone().multiplyScalar(30.0);
            yz.multiply(f);
            yz.multiply(f.clone().multiply(f.clone().addScalar(-2)).addScalar(1.0));
            yz.multiply(new THREE.Vector2(b-a, c-a).add(new THREE.Vector2(u.y, u.x).multiplyScalar(a-b-c+d)));
            return new THREE.Vector3(
                    a+(b-a)*u.x+(c-a)*u.y+(a-b-c+d)*u.x*u.y,
                    yz.x,
                    yz.y);
        }

        // x = Vector2
        function terrain( x ) {
            var p = x.clone().multiplyScalar(0.003);
            var a = 0.0;
            var b = 1.0;
            var d = new THREE.Vector2(0, 0);
            for(var i = 0; i < 5; i++) {
                var n = noised(p);
                d.add(new THREE.Vector2(n.y, n.z));
                a += b*n.x/(1.0+d.lengthSq());
                b *= 0.5;
                p = new THREE.Vector2(1.6*p.x - 1.2 * p.y, 1.2 * p.x + 1.6 * p.y);
            }

            return 140.0*a;
        }

        return {
            noise: noise,
            noised: noised,
            terrain: terrain
        };
    })();

    var scene, camera, renderer;

    var worldMesh;

    function init(_renderer, _audioContext) {
        renderer = _renderer;
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, _renderer.domElement.width / _renderer.domElement.height, 1, 120000);
        camera.position.set(0, 0, 50000);

        var geometry = new THREE.BoxGeometry(2, 2, 2, 100, 100, 100);
        geometry.vertices.forEach(function (vertex) {
            vertex.normalize();
            var noise = TerrainGen.terrain(new THREE.Vector2(vertex.x * 1000, vertex.y * 1000));
            vertex.normalize().multiplyScalar(20000 + 100 * noise);
        });
        geometry.computeFaceNormals();
        var material = new THREE.MeshLambertMaterial({
            color: 0xbbbbbb,
            ambient: 0x222222,
            shading: THREE.FlatShading
        });

        worldMesh = new THREE.Mesh(geometry, material);
        scene.add(worldMesh);

        var directionalLight = new THREE.DirectionalLight(0xffffff);
        scene.add(directionalLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(1, -1, 1);
        scene.add(directionalLight);

        var ambientLight = new THREE.AmbientLight(0xffffff);
        scene.add(ambientLight);


        window.camera = camera;
        window.renderer = renderer;
        window.scene = scene;
    }

    function animate(timeStep) {
        camera.position.set(50000 * Math.cos(Date.now() / 1000), 50000 * Math.sin(Date.now() / 1000), 50000);
        camera.lookAt(new THREE.Vector3());
        renderer.render(scene, camera);
    }

    var sketch = {
        id: "world",
        init: init,
        animate: animate
    };
    initializeSketch(sketch);
})();
