(function () {
    var frame = 0;
    var gridOffset = 0;
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

    function permutedLine(ox, oy, nx, ny, context) {
        function permutedMove(x, y) {
            var grad = gradient(x, y);
            context.moveTo(x + grad[0], y + grad[1]);
        }
        function permutedPoint(x, y) {
            var grad = gradient(x, y);
            context.lineTo(x + grad[0], y + grad[1]);
        }

        permutedMove(ox, oy);

        var STEPS = 4;
        for( var t = 1; t <= STEPS; t += 1) {
            var percentage = t / STEPS;
            permutedPoint(ox + (nx - ox) * percentage,
                          oy + (ny - oy) * percentage);
        }
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

    var audio;

    function init($sketchElement, context, audioContext) {
        canvas = $sketchElement.find("canvas")[0];
        // audio = createAudioGroup(audioContext);
    }

    function animate($sketchElement, context, audioContext) {
        frame++;
        width = canvas.width;
        height = canvas.height;

        if (frame % 1000 < 500) {
            // audio.osc.frequency.value = BASE_FREQUENCY - (frame % 500 / 500 * 60);
            context.fillStyle = "rgba(13,7,5,0.04)";
        } else {
            // audio.osc.frequency.value = BASE_FREQUENCY / 2 * Math.pow(2, 7 / 12);
            context.fillStyle = "rgba(252,252,252,0.04)";
        }
        context.beginPath();
        var GRIDSIZE = 50;
        gridOffset = (gridOffset + Math.map(mouseX, 0, width, 0.6, 1.5)) % GRIDSIZE;
        for (var x = -GRIDSIZE + gridOffset; x < width + GRIDSIZE; x += GRIDSIZE) {
            for (var y = -GRIDSIZE + gridOffset; y < height + GRIDSIZE; y += GRIDSIZE) {

                if (drawMode & 0x1) permutedLine(x, y, x + GRIDSIZE, y + GRIDSIZE, context);
                if (drawMode & 0x2) permutedLine(x + GRIDSIZE, y, x, y + GRIDSIZE, context);
                if (drawMode & 0x4) permutedLine(x + GRIDSIZE, y + GRIDSIZE, x, y + GRIDSIZE, context);
                if (drawMode & 0x8) permutedLine(x, y + GRIDSIZE, x, y, context);
            }
        }
        context.fill();
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

