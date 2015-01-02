(function () {

    var NUM_PARTICLES = 10000;
    var TIME_STEP = 1 / 20;
    var GRAVITY_CONSTANT = 100;
    // speed becomes this percentage of its original speed every second
    var PULLING_DRAG_CONSTANT = 0.96075095702;
    var INERTIAL_DRAG_CONSTANT = 0.73913643334;

    var attractor = null;
    var canvas;
    var dragConstant = INERTIAL_DRAG_CONSTANT;
    var lastAutoAttractPromise;
    var particles = [];
    var returnToStartPower = 0;

    function beginAutoAttract() {
        if (lastAutoAttractPromise != null) {
            endAutoAttract();
        }
        function createAutoAttractLoop() {
            var iteration = P.delay(8000).cancellable()
            .then(function () {
                attractor = {
                    x: Math.map(Math.random(), 0, 1, canvas.width / 4, canvas.width * 3 / 4),
                    y: Math.map(Math.random(), 0, 1, canvas.height / 4, canvas.height * 3 / 4)
                }
            }).then(function () {
                return P.delay(3000);
            }).then(function () {
                attractor = null;
            }).then(function () {
                return createAutoAttractLoop();
            });
            return iteration;
        }

        lastAutoAttractPromise = P.delay(5000).cancellable().then(function () { return createAutoAttractLoop(); });
        return lastAutoAttractPromise;
    }

    function endAutoAttract() {
        try {
            lastAutoAttractPromise.cancel();
        } catch(e) {
            // no op
        }
        lastAutoAttractPromise = null;
    }

    var AUDIO_PARTICLE_SAMPLE_COUNT = 20;
    var AUDIO_FAST_VELOCITY = 200;

    var audioContext = new AudioContext();
    var audioGroups = [];

    function createAudioGroup() {
        var noiseGain = audioContext.createGain();
        noiseGain.gain.value = 0.0;

        // var noise = (function() {
        //     var node = audioContext.createBufferSource()
        //     , buffer = audioContext.createBuffer(1, audioContext.sampleRate * 5, audioContext.sampleRate)
        //     , data = buffer.getChannelData(0);
        //
        //     for (var i = 0; i < buffer.length; i++) {
        //         data[i] = Math.random();
        //     }
        //     node.buffer = buffer;
        //     node.loop = true;
        //     return node;
        // })();
        //

        // pink noise from http://noisehack.com/generate-noise-web-audio-api/
        var noise = (function() {
            var bufferSize = 4096;
            var b0, b1, b2, b3, b4, b5, b6;
            b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
            var node = audioContext.createScriptProcessor(bufferSize, 1, 1);
            node.onaudioprocess = function(e) {
                var output = e.outputBuffer.getChannelData(0);
                for (var i = 0; i < bufferSize; i++) {
                    var white = Math.random() * 2 - 1;
                    b0 = 0.99886 * b0 + white * 0.0555179;
                    b1 = 0.99332 * b1 + white * 0.0750759;
                    b2 = 0.96900 * b2 + white * 0.1538520;
                    b3 = 0.86650 * b3 + white * 0.3104856;
                    b4 = 0.55000 * b4 + white * 0.5329522;
                    b5 = -0.7616 * b5 - white * 0.0168980;
                    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                    output[i] *= 0.11; // (roughly) compensate for gain
                    b6 = white * 0.115926;
                }
            }
            return node;
        })();

        var lowpass = audioContext.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 1000;
        lowpass.Q.value = 2.5;


        noise.connect(noiseGain);
        noiseGain.connect(lowpass);
        return {
            noise: noise,
            noiseGain: noiseGain,
            lowpass: lowpass
        };
    }

    for(var i = 0; i < AUDIO_PARTICLE_SAMPLE_COUNT; i++) {
        audioGroups[i] = createAudioGroup();
        audioGroups[i].lowpass.connect(audioContext.destination);
    }

    function init($sketchElement, stage, renderer) {
        canvas = $sketchElement.find("canvas")[0];
        var particleCanvas = $("<canvas>").attr("width", 3).attr("height", 3)[0];
        var particleCanvasContext = particleCanvas.getContext('2d');
        particleCanvasContext.fillStyle = 'rgba(255, 255, 255, 0.3)';
        particleCanvasContext.fillRect(0.5, 0.5, 2, 2);
        particleCanvasContext.fillRect(1, 1, 1, 1);
        stage.setBackgroundColor(0x000000);

        var particleTexture = PIXI.Texture.fromCanvas(particleCanvas);

        var container = new PIXI.SpriteBatch();
        stage.addChild(container);

        $sketchElement.find(".reset").click(function() {
            for (var i = 0; i < NUM_PARTICLES; i++) {
                particles[i].dx = 0;
                particles[i].dy = 0;
            }
            returnToStartPower = 0.01;
        });

        for( var i = 0; i < NUM_PARTICLES; i++ ) {
            var particleSprite = new PIXI.Sprite(particleTexture);
            container.addChild(particleSprite);
            particles[i] = {
                x: i * canvas.width / NUM_PARTICLES,
                y: canvas.height / 2,
                dx: 0,
                dy: 0,
                sprite: particleSprite
            };
        }

        beginAutoAttract();
    }

    function animate($sketchElement, stage, renderer) {
        if (returnToStartPower > 0 && returnToStartPower < 1) {
            returnToStartPower *= 1.01;
        }
        for (var i = 0; i < NUM_PARTICLES; i++) {
            var particle = particles[i];
            if (attractor != null) {
                var dx = attractor.x - particle.x;
                var dy = attractor.y - particle.y;
                var length2 = Math.sqrt(dx*dx + dy*dy);
                var forceX = GRAVITY_CONSTANT * dx / length2;
                var forceY = GRAVITY_CONSTANT * dy / length2;

                particle.dx += forceX * TIME_STEP;
                particle.dy += forceY * TIME_STEP;
            }
            particle.dx *= Math.pow(dragConstant, TIME_STEP);
            particle.dy *= Math.pow(dragConstant, TIME_STEP);

            particle.x += particle.dx * TIME_STEP;
            particle.y += particle.dy * TIME_STEP;

            var wantedX = i * canvas.width / NUM_PARTICLES;
            var wantedY = canvas.height / 2;
            if (returnToStartPower > 0) {
                particle.x -= (particle.x - wantedX) * returnToStartPower;
                particle.y -= (particle.y - wantedY) * returnToStartPower;
            }

            particle.sprite.position.x = particle.x;
            particle.sprite.position.y = particle.y;
        }

        for (var i = 0; i < AUDIO_PARTICLE_SAMPLE_COUNT; i++) {
            var audioGroup = audioGroups[i];
            var particle = particles[Math.floor(Math.map(i, 0, AUDIO_PARTICLE_SAMPLE_COUNT - 1, 0, NUM_PARTICLES - 1))];
            var velocity = Math.sqrt(particle.dx * particle.dx + particle.dy * particle.dy);
            var wantedGain = Math.map(velocity, 0, AUDIO_FAST_VELOCITY, 0, 1) / AUDIO_PARTICLE_SAMPLE_COUNT;
            audioGroup.lowpass.frequency.value = Math.map(particle.y, 0, canvas.height, 300, 15000);
            audioGroup.noiseGain.gain.value = wantedGain;
        }
        renderer.render(stage);
    }

    function mousedown(event) {
        var mouseX = event.offsetX == undefined ? event.originalEvent.layerX : event.offsetX;
        var mouseY = event.offsetY == undefined ? event.originalEvent.layerY : event.offsetY;
        attractor = { x: mouseX, y : mouseY };
        dragConstant = PULLING_DRAG_CONSTANT;
        returnToStartPower = 0;
        endAutoAttract();
    }

    function mousemove(event) {
        var mouseX = event.offsetX == undefined ? event.originalEvent.layerX : event.offsetX;
        var mouseY = event.offsetY == undefined ? event.originalEvent.layerY : event.offsetY;
        if (attractor != null) {
            attractor.x = mouseX;
            attractor.y = mouseY;
        }
        endAutoAttract();
    }

    function mouseup(event) {
        dragConstant = INERTIAL_DRAG_CONSTANT;
        attractor = null;
        beginAutoAttract();
    }

    var sketch2 = {
        init: init,
        animate: animate,
        html: '<div class="topbar">Click for gravity.<button class="reset">Reset</button></div><canvas></canvas>',
        mousedown: mousedown,
        mousemove: mousemove,
        mouseup: mouseup,
        usePixi: true
    };
    initializeSketch(sketch2, "sketch2");
})();
