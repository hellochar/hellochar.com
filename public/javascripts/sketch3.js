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
        var distance = Math.sqrt(Math.pow(ox-nx, 2) + Math.pow(oy-ny, 2));
        var STEPS = distance / 11;
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

    function signum(x) {
        return x / Math.abs(x);
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

    // offsetX and offsetY define the vector that the line draws on (the inline direction). the direction that
    // the vector offsets to repeat itself is the traversal direction. The two are always orthogonal.
    function LineStrip(width, height, offsetX, offsetY, gridSize) {
        this.inlineAngle = Math.atan(offsetY / offsetX);
        this.gridSize = gridSize;

        // the specific offset of the entire line for this frame
        this.gridOffsetX = 0;
        this.gridOffsetY = 0;

        this.resize(width, height);
    }

    LineStrip.prototype.update = function(dx, dy) {
        this.gridOffsetX = ((this.gridOffsetX + dx) % this.gridSize + this.gridSize) % this.gridSize;
        this.gridOffsetY = ((this.gridOffsetY + dy) % this.gridSize + this.gridSize) % this.gridSize;
        this.lines.forEach(function(lineMesh) {
            var x = lineMesh.x;
            var y = lineMesh.y;
            var inlineOffsetX = lineMesh.inlineOffsetX;
            var inlineOffsetY = lineMesh.inlineOffsetY;
            var geometry = lineMesh.geometry;
            permutedLine(x + this.gridOffsetX - inlineOffsetX,
                         y + this.gridOffsetY - inlineOffsetY,
                         x + this.gridOffsetX + inlineOffsetX,
                         y + this.gridOffsetY + inlineOffsetY,
                         geometry);
            geometry.verticesNeedUpdate = true;
        }.bind(this));
    }

    LineStrip.prototype.resize = function(width, height) {
        this.width = width;
        this.height = height;
        // delete old lines
        if (this.lines != null) {
            this.lines.forEach(function(mesh) {
                scene.remove(mesh);
            });
        }

        this.lines = [];
        this.gridOffset = 0;

        var diagLength = Math.sqrt(this.width*this.width + this.height*this.height) + 2 * this.gridSize;

        // create and add a Line mesh to the lines array
        var createAndAddLine = function(x, y) {
            var inlineOffsetX = Math.cos(this.inlineAngle) * diagLength / 2;
            var inlineOffsetY = Math.sin(this.inlineAngle) * diagLength / 2;
            var geometry = permutedLine(x - inlineOffsetX, y - inlineOffsetY, x + inlineOffsetX, y + inlineOffsetY);
            var lineMesh = new THREE.Line(geometry, lineMaterial);
            lineMesh.frustumCulled = false;
            this.lines.push(lineMesh);
            scene.add(lineMesh);
            lineMesh.x = x;
            lineMesh.y = y;
            lineMesh.inlineOffsetX = inlineOffsetX;
            lineMesh.inlineOffsetY = inlineOffsetY;
        }.bind(this);

        var midX = this.width/2;
        var midY = this.height/2;
        var traversalAngle = this.inlineAngle + Math.PI / 2;
        for (var d = -diagLength/2; d < diagLength/2; d += this.gridSize) {
            var lineX = midX + Math.cos(traversalAngle) * d;
            var lineY = midY + Math.sin(traversalAngle) * d;
            createAndAddLine(lineX, lineY);
        }
    }

    var lineStrips = [];

    function init(_renderer, audioContext) {
        renderer = _renderer;

        renderer.setPixelRatio((window.devicePixelRatio + 1) / 2);
        renderer.autoClearColor = false;
        renderer.setClearColor(0xfcfcfc, 1);
        renderer.clear();
        canvas = renderer.domElement;
        width = canvas.width;
        height = canvas.height;
        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(0, canvas.width, 0, canvas.height, 1, 1000);
        camera.position.z = 500;

        // lineStrips.push(new LineStrip(canvas.width, canvas.height, 50, 50, 50));
        lineStrips.push(new LineStrip(canvas.width, canvas.height, 50, -50, 50));
        lineStrips.push(new LineStrip(canvas.width, canvas.height, 0, 50, 50));
        // lineStrips.push(new LineStrip(canvas.width, canvas.height, 50, 0, 50));
    }

    function animate() {
        width = canvas.width;
        height = canvas.height;

        var opacityChangeFactor = 0.1;
        if (isMouseDown) {
            lineMaterial.opacity = lineMaterial.opacity * (1 - opacityChangeFactor) + 0.25 * opacityChangeFactor;
            frame += 4;
        } else {
            lineMaterial.opacity = lineMaterial.opacity * (1 - opacityChangeFactor) + 0.03 * opacityChangeFactor;
            frame += 1;
        }

        if (frame % 1000 < 500) {
            lineMaterial.color.set("rgb(50, 12, 12)");
        } else {
            lineMaterial.color.set("rgb(252, 247, 243)");
        }

        var dx = Math.map(mouseX, 0, width, -1, 1) * 1.0;
        var dy = Math.map(mouseY, 0, height, -1, 1) * 1.0;
        lineStrips.forEach(function (lineStrip) {
            lineStrip.update(dx, dy);
        });
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

        lineStrips.forEach(function (lineStrip) {
            lineStrip.resize(width, height);
        });
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

