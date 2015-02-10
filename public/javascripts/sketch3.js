(function () {
    var frame = 0;
    var drawMode = 7;
    var canvas;

    var width, height;

    var mouseX = 0;
    var mouseY = 0;

    var fnCosLengthScalar = 1.0;
    var fnFrameDivider = 25;
    function fn(x, y) {
        var dx = (x - width/2);
        var dy = (y - height/2);
        var length2 = dx*dx + dy*dy;
        var z1 = 23000 / (1 + Math.exp(-length2 / 10000));
        var z2 = 600 * Math.cos(length2 / 25000 * fnCosLengthScalar + frame / fnFrameDivider);

        return Math.lerp(z1, z2, (1+Math.sin(frame / 100))/2);
    }

    function gradient(x, y) {
        var fnxy = fn(x, y);
        var epsilon = 1e-4;
        var ddx = (fn(x + epsilon, y) - fnxy) / epsilon;
        var ddy = (fn(x, y + epsilon) - fnxy) / epsilon;

        return [ddx, ddy];
    }

    function permutedLine(ox, oy, nx, ny, geometry) {
        var STEPS = 4;
        if (geometry == null) {
            geometry = new THREE.Geometry();
            for( var t = 0; t <= STEPS; t++) {
                geometry.vertices.push(new THREE.Vector3());
            }
        }

        function permutePoint(x, y, idx) {
            var grad = gradient(x, y);
            geometry.vertices[idx].set(x + grad[0], y + grad[1], 0);
        }

        for( var t = 0; t <= STEPS; t++) {
            var percentage = t / STEPS;
            permutePoint(ox + (nx - ox) * percentage,
                         oy + (ny - oy) * percentage, t);
        }
        return geometry;
    }

    var BASE_FREQUENCY = 141;

    function createAudioGroup(audioContext) {
        var osc = audioContext.createOscillator();
        osc.frequency.value = BASE_FREQUENCY;
        osc.type = "sawtooth";
        osc.start(0);

        function makeLowpass() {
            var lowpass = audioContext.createBiquadFilter();
            lowpass.type = "lowpass";
            lowpass.frequency.value = 110;
            lowpass.Q.value = 1.0;
            return lowpass;
        }

        var lp1 = makeLowpass();
        osc.connect(lp1);

        var lp2 = makeLowpass();
        lp1.connect(lp2);

        var gain = audioContext.createGain();
        gain.gain.value = 1.0;
        lp2.connect(gain);

        gain.connect(audioContext.gain);

        return {
            osc: osc,
            lp2: lp2,
            gain: gain
        };
    }

    var audioGroup;

    // threejs stuff
    var camera;
    var renderer;
    var scene;

    // a map indexed by [(pixel x coordinate).toString()+(pixel y coordinate).toString()] of the mesh that lives there
    var lineMaterial = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.04 });

    function LineStrip(offsetX, offsetY, gridSize) {
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.lines = {};
        this.gridOffset = 0;
        this.gridSize = gridSize;
        for (var x = -this.gridSize * 2; x < canvas.width + this.gridSize; x += this.gridSize) {
            for (var y = -this.gridSize * 2; y < canvas.height + this.gridSize; y += this.gridSize) {
                var geometry = permutedLine(x, y, x + offsetX, y + offsetY);
                var lineMesh = new THREE.Line(geometry, lineMaterial);
                lineMesh.frustumCulled = false;

                this.lines[x.toString()+y.toString()] = lineMesh;
                scene.add(lineMesh);
            }
        }
    }

    LineStrip.prototype.update = function(delta) {
        this.gridOffset = (this.gridOffset + delta) % this.gridSize;
        for (var x = -this.gridSize * 2; x < width + this.gridSize; x += this.gridSize) {
            for (var y = -this.gridSize * 2; y < height + this.gridSize; y += this.gridSize) {
                var geometry = this.lines[x.toString()+y.toString()].geometry;
                permutedLine(x + this.gridOffset,                y + this.gridOffset,
                             x + this.gridOffset + this.offsetX, y + this.gridOffset + this.offsetY,
                             geometry);
                geometry.verticesNeedUpdate = true;
            }
        }
    }

    var lineStripVertical;
    var lineStripHorizontal;
    var lineStripDiagonal;

    function init(_renderer, audioContext) {
        renderer = _renderer;

        renderer.autoClearColor = false;
        renderer.setClearColor(0xfcfcfc, 1);
        renderer.clear();
        canvas = renderer.domElement;
        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(0, canvas.width, 0, canvas.height, 1, 1000);
        camera.position.z = 500;

        lineStripDiagonal = new LineStrip(50, 50, 250);
        lineStripVertical = new LineStrip(0, 50, 50);
        lineStripHorizontal = new LineStrip(50, 0, 250);
    }

    function animate() {
        frame++;
        width = canvas.width;
        height = canvas.height;

        if (frame % 1000 < 500) {
            lineMaterial.color.set("rgb(50, 12, 12)");
        } else {
            lineMaterial.color.set("rgb(252, 252, 252)");
        }
        var delta = Math.map(mouseX, 0, width, 0.6, 1.5);
        // lineStripDiagonal.update(delta);
        lineStripVertical.update(delta);
        // lineStripHorizontal.update(delta);
        renderer.render(scene, camera);
    }

    function mousemove(event) {
        mouseX = event.offsetX == undefined ? event.originalEvent.layerX : event.offsetX;
        mouseY = event.offsetY == undefined ? event.originalEvent.layerY : event.offsetY;
        fnCosLengthScalar = Math.map(mouseX, 0, width, 0.9, 1.1);
        fnFrameDivider = Math.map(mouseX, 0, width, 43, 11);
    }

    function mousedown(event) {
        // 4 lines to draw, cycle through all 16 permutations
        drawMode = (drawMode + 1) % 16;
    }

    function resize(windowX, windowY) {
        // draw black again
        frame = 0;
    }

    var sketch3 = {
        init: init,
        animate: animate,
        mousemove: mousemove,
        mousedown: mousedown,
        resize: resize
    };
    initializeSketch(sketch3, "sphere");
})();

