(function () {

    var NUM_PARTICLES = 10000;
    var NUM_STARS = 00;
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
    var stars = [];

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
        if (lastAutoAttractPromise != null) {
            // catch the cancellation exception
            lastAutoAttractPromise.catch(function() { });
            lastAutoAttractPromise.cancel();
            lastAutoAttractPromise = null;
        }
    }

    var audioGroup;

    // When the dots are all spread out and particle-y, it should sound like wind/noise (maybe swishy)
    // When the dots are coming together the audio should turn into a specific tone at a medium distance,
    // and go up in harmonics as the sound gets closer and closer
    // there should always be some background audio that has the base frequency in it

    function createAudioGroup(audioContext) {

        // white noise
        var noise = (function() {
            var node = audioContext.createBufferSource()
            , buffer = audioContext.createBuffer(1, audioContext.sampleRate * 5, audioContext.sampleRate)
            , data = buffer.getChannelData(0);
            for (var i = 0; i < buffer.length; i++) {
                data[i] = Math.random();
            }
            node.buffer = buffer;
            node.loop = true;
            node.start(0);
            return node;
        })();

        // // pink noise from http://noisehack.com/generate-noise-web-audio-api/
        // var noise = (function() {
        //     var bufferSize = 4096;
        //     var b0, b1, b2, b3, b4, b5, b6;
        //     b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        //     var node = audioContext.createScriptProcessor(bufferSize, 1, 1);
        //     node.onaudioprocess = function(e) {
        //         var output = e.outputBuffer.getChannelData(0);
        //         for (var i = 0; i < bufferSize; i++) {
        //             var white = Math.random() * 2 - 1;
        //             b0 = 0.99886 * b0 + white * 0.0555179;
        //             b1 = 0.99332 * b1 + white * 0.0750759;
        //             b2 = 0.96900 * b2 + white * 0.1538520;
        //             b3 = 0.86650 * b3 + white * 0.3104856;
        //             b4 = 0.55000 * b4 + white * 0.5329522;
        //             b5 = -0.7616 * b5 - white * 0.0168980;
        //             output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        //             output[i] *= 0.11; // (roughly) compensate for gain
        //             b6 = white * 0.115926;
        //         }
        //     }
        //     return node;
        // })();

        var noiseSourceGain = audioContext.createGain();
        noiseSourceGain.gain.value = 0;
        noise.connect(noiseSourceGain);

        var noiseFilter = audioContext.createBiquadFilter();
        noiseFilter.type = "lowpass";
        noiseFilter.frequency.value = 0;
        noiseFilter.Q.value = 1.0;
        noiseSourceGain.connect(noiseFilter);

        var noiseShelf = audioContext.createBiquadFilter();
        noiseShelf.type = "lowshelf";
        noiseShelf.frequency.value = 1200;
        noiseShelf.gain.value = 8;
        noiseFilter.connect(noiseShelf);

        var noiseGain = audioContext.createGain();
        noiseGain.gain.value = 1.0;
        noiseShelf.connect(noiseGain);

        var BASE_FREQUENCY = 320;
        function detuned(freq, centsOffset) {
            return freq * Math.pow(2, centsOffset / 1200);
        }
        function semitone(freq, semitoneOffset) {
            return detuned(freq, semitoneOffset * 100);
        }
        var source1 = (function() {
            var node = audioContext.createOscillator();
            node.frequency.value = detuned(BASE_FREQUENCY / 2, 2);
            node.type = "square";
            node.start(0);

            var gain = audioContext.createGain();
            gain.gain.value = 0.30;
            node.connect(gain);

            return gain;
        })();
        var source2 = (function() {
            var node = audioContext.createOscillator();
            node.frequency.value = BASE_FREQUENCY;
            node.type = "sawtooth";
            node.start(0);

            var gain = audioContext.createGain();
            gain.gain.value = 0.30;
            node.connect(gain);

            return gain;
        })();

        var chordSource = (function() {
            var base = audioContext.createOscillator();
            base.frequency.value = BASE_FREQUENCY;
            base.start(0);

            var octave = audioContext.createOscillator();
            octave.frequency.value = semitone(BASE_FREQUENCY, 12);
            octave.type = "sawtooth";
            octave.start(0);

            var fifth = audioContext.createOscillator();
            fifth.frequency.value = semitone(BASE_FREQUENCY, 12 + 7);
            fifth.type = "sawtooth";
            fifth.start(0);

            var octave2 = audioContext.createOscillator();
            octave2.frequency.value = semitone(BASE_FREQUENCY, 24);
            octave2.type = "sawtooth";
            octave2.start(0);

            var fourth = audioContext.createOscillator();
            fourth.frequency.value = semitone(BASE_FREQUENCY, 24 + 4);
            fourth.start(0);

            var gain = audioContext.createGain();
            gain.gain.value = 0.0;
            base.connect(gain);
            octave.connect(gain);
            fifth.connect(gain);
            octave2.connect(gain);
            fourth.connect(gain);

            return gain;
        })();

        var sourceGain = audioContext.createGain();
        sourceGain.gain.value = 0.0;

        var sourceLfo = audioContext.createOscillator();
        sourceLfo.frequency.value = 8.66;
        sourceLfo.start(0);

        var lfoGain = audioContext.createGain();
        lfoGain.gain.value = 0;

        sourceLfo.connect(lfoGain);

        var filter = audioContext.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 0;
        filter.Q.value = 2.18;

        var filter2 = audioContext.createBiquadFilter();
        filter2.type = "bandpass";
        filter2.frequency.value = 0;
        filter2.Q.value = 2.18;

        var filterGain = audioContext.createGain();
        filterGain.gain.value = 0.4;

        chordSource.connect(sourceGain);
        source1.connect(sourceGain);
        source2.connect(sourceGain);
        sourceGain.connect(filter);

        lfoGain.connect(filter.frequency);
        lfoGain.connect(filter2.frequency);
        filter.connect(filter2);
        filter2.connect(filterGain);

        var audioGain = audioContext.createGain();
        audioGain.gain.value = 1.0;

        noiseGain.connect(audioGain);
        filterGain.connect(audioGain);

        var analyser = audioContext.createAnalyser();
        audioGain.connect(analyser);

        var compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.value = -50;
        compressor.knee.value = 12;
        compressor.ratio.value = 2;
        analyser.connect(compressor);

        var highAttenuation = audioContext.createBiquadFilter();
        highAttenuation.type = "highshelf";
        highAttenuation.frequency.value = BASE_FREQUENCY * 4;
        highAttenuation.gain.value = -6;
        compressor.connect(highAttenuation);

        var highAttenuation2 = audioContext.createBiquadFilter();
        highAttenuation2.type = "highshelf";
        highAttenuation2.frequency.value = BASE_FREQUENCY * 8;
        highAttenuation2.gain.value = -6;
        highAttenuation.connect(highAttenuation2);

        highAttenuation2.connect(audioContext.gain);

        return {
            analyser: analyser,
            chordGain: chordSource,
            sourceGain: sourceGain,
            sourceLfo: sourceLfo,
            lfoGain: lfoGain,
            filter: filter,
            filter2: filter2,
            filterGain: filterGain,
            setFrequency: function(freq) {
                filter.frequency.value = freq;
                filter2.frequency.value = freq;
                lfoGain.gain.value = freq * .06;
            },
            setNoiseFrequency: function(freq) {
                noiseFilter.frequency.value = freq;
            },
            setVolume: function(volume) {
                sourceGain.gain.value = volume;
                noiseSourceGain.gain.value = volume * 0.05;
                chordSource.gain.value = 0.5;
            }
        };
    }

    function init($sketchElement, stage, renderer, audioContext) {
        canvas = $sketchElement.find("canvas")[0];

        audioGroup = createAudioGroup(audioContext);

        var particleCanvas = $("<canvas>").attr("width", 3).attr("height", 3)[0];
        var particleCanvasContext = particleCanvas.getContext('2d');
        particleCanvasContext.fillStyle = 'rgba(255, 255, 255, 0.3)';
        particleCanvasContext.fillRect(0.5, 0.5, 2, 2);
        particleCanvasContext.fillRect(1, 1, 1, 1);
        stage.setBackgroundColor(0x000000);

        var particleTexture = PIXI.Texture.fromCanvas(particleCanvas);

        var starTexture = PIXI.Texture.fromImage("star.png");

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
            // var particleSprite = new PIXI.Sprite(particleTexture);

            var particleSprite = new PIXI.Sprite(starTexture);
            particleSprite.anchor.x = 0.5;
            particleSprite.anchor.y = 0.5;
            particleSprite.alpha = 0.80;

            var scale = 0.10;
            particleSprite.scale.x = scale;
            particleSprite.scale.y = scale;
            particleSprite.rotation = Math.random() * Math.PI * 2;

            container.addChild(particleSprite);
            particles[i] = {
                x: i * canvas.width / NUM_PARTICLES,
                y: canvas.height / 2,
                dx: 0,
                dy: 0,
                sprite: particleSprite
            };
        }

        for (var i = 0; i < NUM_STARS; i++) {
            var scale = Math.pow(Math.map(i, 0, NUM_STARS, Math.pow(0.01, 1/3), Math.pow(0.3, 1/3)), 3);
            var moveScale = Math.map(Math.random(), 0, 1, 0.5, 1.25);

            var starSprite = new PIXI.Sprite(starTexture);
            starSprite.anchor.x = 0.5;
            starSprite.anchor.y = 0.5;
            starSprite.scale.x = scale;
            starSprite.scale.y = scale;
            starSprite.rotation = Math.random() * Math.PI * 2;
            stage.addChild(starSprite);
            stars[i] = {
                x: Math.map(Math.random(), 0, 1, -100, canvas.width + 100),
                y: Math.map(Math.random(), 0, 1, -100, canvas.height + 100),
                moveScale: moveScale,
                scale: scale,
                sprite: starSprite
            };
        }

        beginAutoAttract();
    }

    function animate($sketchElement, stage, renderer) {
        if (returnToStartPower > 0 && returnToStartPower < 1) {
            returnToStartPower *= 1.01;
        }
        var averageX = 0, averageY = 0;
        var averageVel2 = 0;
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
            averageX += particle.x;
            averageY += particle.y;
            averageVel2 += particle.dx * particle.dx + particle.dy * particle.dy;
        }
        for (var i = 0; i < NUM_STARS; i++) {
            var star = stars[i];
            if (attractor != null) {
                var dx = attractor.x - star.x;
                var dy = attractor.y - star.y;
                var length = Math.sqrt(dx*dx + dy*dy);
                star.x += dx / length * star.scale * star.moveScale;
                star.y += dy / length * star.scale * star.moveScale;
            } else {
                star.x += 1 * star.scale * star.moveScale;
            }


            if (star.x > canvas.width + 100) {
                star.x = -100;
                star.y = Math.map(Math.random(), 0, 1, -100, canvas.height + 100);
            }
            star.sprite.position.x = star.x;
            star.sprite.position.y = star.y;
        }
        averageX /= NUM_PARTICLES;
        averageY /= NUM_PARTICLES;
        averageVel2 /= NUM_PARTICLES;
        var varianceX2 = 0;
        var varianceY2 = 0;
        var varianceVel22 = 0;
        var entropy = 0;
        var numLeft = 0, numRight = 0;
        for (var i = 0; i < NUM_PARTICLES; i++) {
            var particle = particles[i];
            var dx2 = Math.pow(particle.x - averageX, 2),
                dy2 = Math.pow(particle.y - averageY, 2);
            varianceX2 += dx2;
            varianceY2 += dy2;
            varianceVel22 += Math.pow(particle.dx * particle.dx + particle.dy * particle.dy - averageVel2, 2);
            var length = Math.sqrt(dx2 + dy2);
            entropy += length * Math.log(length);
            if (particle.x < averageX) {
                numLeft++;
            } else {
                numRight++;
            }
        }
        entropy /= NUM_PARTICLES;
        varianceX2 /= NUM_PARTICLES;
        varianceY2 /= NUM_PARTICLES;
        varianceVel22 /= NUM_PARTICLES;

        var varianceX = Math.sqrt(varianceX2);
        var varianceY = Math.sqrt(varianceY2);
        var varianceVel2 = Math.sqrt(varianceVel22);

        var varianceLength = Math.sqrt(varianceX2 + varianceY2);
        var varianceVel = Math.sqrt(varianceVel2);
        var averageVel = Math.sqrt(averageVel2);

        // flatRatio = 1 -> perfectly circular
        // flatRatio is high (possibly Infinity) -> extremely horizontally flat
        // flatRatio is low (near 0) -> vertically thin
        var flatRatio = varianceX / varianceY;

        // in reset formation, the varianceLength = (sqrt(1/2) - 1/2) * magicNumber * canvasWidth
        // magicNumber is experimentally found to be 1.3938
        // AKA varianceLength = 0.28866 * canvasWidth
        var normalizedVarianceLength = varianceLength / (0.28866 * canvas.width);
        var normalizedAverageVel = averageVel / (canvas.width);
        var normalizedEntropy = entropy / (canvas.width * 1.383870349);

        audioGroup.sourceLfo.frequency.value = flatRatio;
        audioGroup.setFrequency(222 / normalizedEntropy);
        var noiseFreq = 2000 * (Math.pow(8, normalizedVarianceLength) / 8);
        audioGroup.setNoiseFrequency(noiseFreq);
        audioGroup.setVolume(Math.max(Math.sqrt(averageVel / varianceLength) - 0.05, 0));

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
