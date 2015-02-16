(function () {
    var HeightMap = {
        canvasWidth: null,
        canvasHeight: null,
        frame: 0,
        /**
         * How wavy the heightmap is, from [0..1]. 0 means not wavy at all (only bulbous); 1.0 means only wavy.
         */
        getWaviness: function() {
            return (1+Math.sin(HeightMap.frame / 100))/2;
        },
        evaluate: function(x, y) {
            var dx = (x - HeightMap.canvasWidth/2);
            var dy = (y - HeightMap.canvasHeight/2);
            var length2 = dx*dx + dy*dy;
            // z1 creates the bulb shape at the center (using a logistic function)
            var z1 = 23000 / (1 + Math.exp(-length2 / 10000));
            // z2 creates the radial wave shapes from the center
            var z2 = 600 * Math.cos(length2 / 25000 + HeightMap.frame / 25);
            // z3 is a smaller radial wave shape that is centered towards the mouse
            var z3 = 100 * Math.cos(Math.sqrt(Math.pow(x - mouseX, 2) + Math.pow(y - mouseY, 2)) / 20 + HeightMap.frame / 25);

            return Math.lerp(z1, z2, HeightMap.getWaviness()) + z3;
        },
        gradient: function (x,y) {
            var fnxy = HeightMap.evaluate(x, y);
            var epsilon = 1e-4;
            var ddx = (HeightMap.evaluate(x + epsilon, y) - fnxy) / epsilon;
            var ddy = (HeightMap.evaluate(x, y + epsilon) - fnxy) / epsilon;

            return [ddx, ddy];
        }
    }

    var mouseX = 0;
    var mouseY = 0;

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
            var grad = HeightMap.gradient(x, y);
            geometry.vertices[idx].set(x + grad[0], y + grad[1], 0);
        }

        for( var t = 0; t <= STEPS; t++) {
            var percentage = t / STEPS;
            permutePoint(ox + (nx - ox) * percentage,
                         oy + (ny - oy) * percentage, t);
        }
        return geometry;
    }

    // offsetX and offsetY define the vector that the line draws on (the inline direction). the direction that
    // the vector offsets to repeat itself is the traversal direction. The two are always orthogonal.
    function LineStrip(width, height, offsetX, offsetY, gridSize) {
        this.inlineAngle = Math.atan(offsetY / offsetX);
        this.gridSize = gridSize;

        // the specific offset of the entire line for this frame
        this.gridOffsetX = 0;
        this.gridOffsetY = 0;

        this.object = new THREE.Object3D();

        this.resize(width, height);
    }

    LineStrip.prototype.update = function(dx, dy) {
        this.gridOffsetX = ((this.gridOffsetX + dx) % this.gridSize + this.gridSize) % this.gridSize;
        this.gridOffsetY = ((this.gridOffsetY + dy) % this.gridSize + this.gridSize) % this.gridSize;
        // console.log(this.gridOffsetX, this.gridOffsetY);
        this.object.children.forEach(function(lineMesh) {
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
        this.gridOffset = 0;

        // delete old lines
        this.object.remove.apply(this.object, this.object.children);

        var diagLength = Math.sqrt(this.width*this.width + this.height*this.height) + 2 * this.gridSize;
        // create and add a Line mesh to the lines array
        var createAndAddLine = function(x, y) {
            var inlineOffsetX = Math.cos(this.inlineAngle) * diagLength / 2;
            var inlineOffsetY = Math.sin(this.inlineAngle) * diagLength / 2;
            var geometry = permutedLine(x - inlineOffsetX, y - inlineOffsetY, x + inlineOffsetX, y + inlineOffsetY);
            var lineMesh = new THREE.Line(geometry, lineMaterial);
            lineMesh.frustumCulled = false;
            this.object.add(lineMesh);
            lineMesh.x = x;
            lineMesh.y = y;
            lineMesh.inlineOffsetX = inlineOffsetX;
            lineMesh.inlineOffsetY = inlineOffsetY;
        }.bind(this);

        var midX = this.width/2;
        var midY = this.height/2;

        createAndAddLine(midX, midY);

        var traversalAngle = this.inlineAngle + Math.PI / 2;
        for (var d = this.gridSize; d < diagLength/2; d += this.gridSize) {
            createAndAddLine(midX + Math.cos(traversalAngle) * d,
                             midY + Math.sin(traversalAngle) * d);
            createAndAddLine(midX - Math.cos(traversalAngle) * d,
                             midY - Math.sin(traversalAngle) * d);
        }
    }

    function createAudioGroup(audioContext) {
        var noise = (function() {
            var node = audioContext.createBufferSource()
            , buffer = audioContext.createBuffer(1, audioContext.sampleRate * 5, audioContext.sampleRate)
            , data = buffer.getChannelData(0);
            for (var i = 0; i < buffer.length; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            node.buffer = buffer;
            node.loop = true;
            node.start(0);
            return node;
        })();

        function setBiquadParameters(node, time) {
            // node.a0 = Math.map(Math.sin(time * 1.1 * Math.PI * 2), -1, 1, 0.3, 1.0);
            // var gridOffsetPercentage = lineStrips[0].gridOffsetX / lineStrips[0].gridSize;
            // var gridOffsetFactor = Math.cos(gridOffsetPercentage * Math.PI);
            node.a0 = getDarkness(HeightMap.frame + 10);
            node.a1 = 0;
            node.a2 = 0;
            node.b1 = Math.map(Math.pow(HeightMap.getWaviness(), 2), 0, 1, -0.93, -0.3);
            node.b2 = 0;
        }

        var biquadFilter = (function() {
            var node = audioContext.createScriptProcessor(1024, 1, 1);
            node.a0 = 1;
            node.a1 = 0.0;
            node.a2 = 0;
            node.b1 = 0;
            node.b2 = 0;
            node.onaudioprocess = function(e) {
                // console.log(getDarkness(HeightMap.frame));
                var input = e.inputBuffer.getChannelData(0);
                var output = e.outputBuffer.getChannelData(0);
                for (var n = 0; n < e.inputBuffer.length; n++) {
                    var time = e.playbackTime + n / audioContext.sampleRate;
                    setBiquadParameters(node, time);
                    var x = input[n];
                    var x1 = input[n - 1] || 0;
                    var x2 = input[n - 2] || 0;
                    var y1 = output[n - 1] || 0;
                    var y2 = output[n - 2] || 0;
                    output[n] = node.a0 * x + 
                                node.a1 * x1 +
                                node.a2 * x2 -
                                node.b1 * y1 -
                                node.b2 * y2;
                }
            }
            return node;
        })();
        noise.connect(biquadFilter);

        var biquadFilterGain = audioContext.createGain();
        biquadFilterGain.gain.value = 0.05;
        biquadFilter.connect(biquadFilterGain);

        biquadFilterGain.connect(audioContext.gain);
        return {
            biquadFilter: biquadFilter
        };
    }

    var audioGroup;
    var lineStrips = [];

    // threejs stuff
    var camera;
    var lineMaterial = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.03 });
    var renderer;
    var scene;

    function init(_renderer, audioContext) {
        audioGroup = createAudioGroup(audioContext);
        renderer = _renderer;

        renderer.setPixelRatio((window.devicePixelRatio + 1) / 2);
        renderer.autoClearColor = false;
        renderer.setClearColor(0xfcfcfc, 1);
        renderer.clear();
        var canvas = renderer.domElement;
        HeightMap.canvasWidth = canvas.width;
        HeightMap.canvasHeight = canvas.height;
        mouseX = canvas.width;
        mouseY = canvas.height;
        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(0, canvas.width, 0, canvas.height, 1, 1000);
        camera.position.z = 500;

        // lineStrips.push(new LineStrip(canvas.width, canvas.height, 1, 1, 50));
        lineStrips.push(new LineStrip(canvas.width, canvas.height, 1, -1, 50));
        lineStrips.push(new LineStrip(canvas.width, canvas.height, 0, 1, 50));
        // lineStrips.push(new LineStrip(canvas.width, canvas.height, 1, 0, 50));

        lineStrips.forEach(function (lineStrip) {
            scene.add(lineStrip.object);
        });
    }

    function animate() {
        var opacityChangeFactor = 0.1;
        if (isMouseDown) {
            lineMaterial.opacity = lineMaterial.opacity * (1 - opacityChangeFactor) + 0.23 * opacityChangeFactor;
            HeightMap.frame += 4;
        } else {
            lineMaterial.opacity = lineMaterial.opacity * (1 - opacityChangeFactor) + 0.03 * opacityChangeFactor;
            HeightMap.frame += 1;
        }

        if (HeightMap.frame % 1000 < 500) {
            lineMaterial.color.set("rgb(50, 12, 12)");
        } else {
            lineMaterial.color.set("rgb(252, 247, 243)");
        }

        var dx = Math.map(mouseX, 0, HeightMap.canvasWidth, -1, 1) * 2.20;
        var dy = Math.map(mouseY, 0, HeightMap.canvasHeight, -1, 1) * 2.20;
        lineStrips.forEach(function (lineStrip) {
            lineStrip.update(dx, dy);
        });
        renderer.render(scene, camera);
    }

    // return a number from [0..1] indicating in general how dark the image is; 1.0 means very dark, while 0.0 means very light
    function getDarkness(frame) {
        if (frame % 1000 < 500) {
            return Math.map(frame % 500, 0, 500, 0, 1);
        } else {
            return Math.map(frame % 500, 0, 500, 1, 0);
        }
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
        HeightMap.canvasWidth = width;
        HeightMap.canvasHeight = height;
        camera.right = width;
        camera.bottom = height;
        camera.updateProjectionMatrix();

        renderer.setClearColor(0xfcfcfc, 1);
        renderer.clear();

        // draw black again
        HeightMap.frame = 0;

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

