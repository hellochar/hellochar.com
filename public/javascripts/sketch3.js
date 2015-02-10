(function () {
    var frame = 0;
    var canvas;

    var width, height;

    var mouseX = 0;
    var mouseY = 0;

    function fn(x, y) {
        var dx = (x - width/2);
        var dy = (y - height/2);
        var length2 = dx*dx + dy*dy;
        var z1 = 23000 / (1 + Math.exp(-length2 / 10000));
        var z2 = 600 * Math.cos(length2 / 25000 + frame / 25);
        var z3 = 40 * Math.cos(Math.sqrt(Math.pow(x - mouseX, 2) + Math.pow(y - mouseY, 2)) / 20 + frame / 25);

        return Math.lerp(z1, z2, (1+Math.sin(frame / 100))/2) + z3;
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
    var lineMaterial = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.03 });

    function LineStrip(width, height, offsetX, offsetY, gridSize) {
        // where each individual line in the linestrip travels towards
        this.offsetX = offsetX;
        this.offsetY = offsetY;

        this.gridSize = gridSize;

        // the specific offset of the entire line for this frame
        this.gridOffsetX = 0;
        this.gridOffsetY = 0;

        this.resize(width, height);
    }

    LineStrip.prototype.update = function(dx, dy) {
        this.gridOffsetX = ((this.gridOffsetX + dx) % this.gridSize + this.gridSize) % this.gridSize;
        this.gridOffsetY = ((this.gridOffsetY + dy) % this.gridSize + this.gridSize) % this.gridSize;
        for (var x = -this.gridSize * 2; x < this.width + this.gridSize; x += this.gridSize) {
            for (var y = -this.gridSize * 2; y < this.height + this.gridSize; y += this.gridSize) {
                var geometry = this.lines[x.toString()+y.toString()].geometry;
                permutedLine(x + this.gridOffsetX,                y + this.gridOffsetY,
                             x + this.gridOffsetX + this.offsetX, y + this.gridOffsetY + this.offsetY,
                             geometry);
                geometry.verticesNeedUpdate = true;
            }
        }
    }

    LineStrip.prototype.resize = function(width, height) {
        this.width = width;
        this.height = height;
        // delete old lines
        if (this.lines != null) {
            $.each(this.lines, function(id, mesh) {
                scene.remove(mesh);
            });
        }

        this.lines = {};
        this.gridOffset = 0;
        for (var x = -this.gridSize * 2; x < this.width + this.gridSize; x += this.gridSize) {
            for (var y = -this.gridSize * 2; y < this.height + this.gridSize; y += this.gridSize) {
                var geometry = permutedLine(x, y, x + this.offsetX, y + this.offsetY);
                var lineMesh = new THREE.Line(geometry, lineMaterial);
                lineMesh.frustumCulled = false;

                this.lines[x.toString()+y.toString()] = lineMesh;
                scene.add(lineMesh);
            }
        }
    }

    var lineStripVertical;
    var lineStripHorizontal;
    var lineStripDiagonal;
    var lineStripCounterDiagonal;

    function init(_renderer, audioContext) {
        renderer = _renderer;

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.autoClearColor = false;
        renderer.setClearColor(0xfcfcfc, 1);
        renderer.clear();
        canvas = renderer.domElement;
        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(0, canvas.width, 0, canvas.height, 1, 1000);
        camera.position.z = 500;

        lineStripDiagonal = new LineStrip(canvas.width, canvas.height, 50, 50, 50);
        lineStripCounterDiagonal = new LineStrip(canvas.width, canvas.height, 50, -50, 50);
        lineStripVertical = new LineStrip(canvas.width, canvas.height, 0, 50, 50);
        lineStripHorizontal = new LineStrip(canvas.width, canvas.height, 50, 0, 50);
    }

    function animate() {
        width = canvas.width;
        height = canvas.height;

        var opacityChangeFactor = 0.1;
        if (isMouseDown) {
            lineMaterial.opacity = lineMaterial.opacity * (1 - opacityChangeFactor) + 0.25 * opacityChangeFactor;
            frame += 5;
        } else {
            lineMaterial.opacity = lineMaterial.opacity * (1 - opacityChangeFactor) + 0.03 * opacityChangeFactor;
            frame += 1;
        }

        if (frame % 1000 < 500) {
            lineMaterial.color.set("rgb(50, 12, 12)");
        } else {
            lineMaterial.color.set("rgb(252, 247, 243)");
        }

        // var delta = Math.map(mouseX, 0, width, 0.6, 1.5);
        var dx = Math.map(mouseX, 0, width, -1, 1) * 4.0;
        var dy = Math.map(mouseY, 0, height, -1, 1) * 4.0;
        lineStripDiagonal.update(dx, dy);
        lineStripCounterDiagonal.update(dx, dy);
        lineStripVertical.update(dx, dy);
        lineStripHorizontal.update(dx, dy);
        renderer.render(scene, camera);
    }

    function mousemove(event) {
        mouseX = event.offsetX == undefined ? event.originalEvent.layerX : event.offsetX;
        mouseY = event.offsetY == undefined ? event.originalEvent.layerY : event.offsetY;
    }

    var isMouseDown = false;
    function mousedown(event) {
        isMouseDown = true;
    }

    function mouseup(event) {
        isMouseDown = false;
    }

    function resize(width, height) {
        camera.right = width;
        camera.bottom = height;
        camera.updateProjectionMatrix();

        renderer.setClearColor(0xfcfcfc, 1);
        renderer.clear();

        // draw black again
        frame = 0;

        lineStripDiagonal.resize(width, height);
        lineStripCounterDiagonal.resize(width, height);
        lineStripVertical.resize(width, height);
        lineStripHorizontal.resize(width, height);
    }

    var sketch3 = {
        id: "waves",
        init: init,
        animate: animate,
        mousemove: mousemove,
        mousedown: mousedown,
        mouseup: mouseup,
        resize: resize
    };
    initializeSketch(sketch3);
})();

