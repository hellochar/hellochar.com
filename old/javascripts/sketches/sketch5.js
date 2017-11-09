(function () {

    var NUM_PARTICLES = 3;
    var TIME_STEP = 1 / 20;

    var canvas;
    var particles = [];

    var audioGroup;

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
        noiseShelf.frequency.value = 2200;
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

        var sourceLow = (function() {
            var node = audioContext.createOscillator();
            node.frequency.value = BASE_FREQUENCY / 4;
            node.type = "sawtooth";
            node.start(0);

            var gain = audioContext.createGain();
            gain.gain.value = 0.60;
            node.connect(gain);

            return gain;
        })();

        function makeChordSource(BASE_FREQUENCY) {
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
        }
        var chordSource = makeChordSource(BASE_FREQUENCY);
        var chordHigh = makeChordSource(BASE_FREQUENCY * 8);

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
        sourceLow.connect(sourceGain);
        chordHigh.connect(filter);
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
                sourceGain.gain.value = volume / 15;
                noiseSourceGain.gain.value = volume * 0.05;
                chordSource.gain.value = 0.02;
                chordHigh.gain.value = volume / 20;
            }
        };
    }

    function init($sketchElement, stage, renderer, audioContext) {
        canvas = $sketchElement.find("canvas")[0];
        audioGroup = createAudioGroup(audioContext);
        stage.setBackgroundColor(0x000000);
        var starTexture = PIXI.Texture.fromImage("star.png");

        container = new PIXI.SpriteBatch();
        stage.addChild(container);

        for( var i = 0; i < NUM_PARTICLES; i++ ) {
            var particleSprite = new PIXI.Sprite(starTexture);
            particleSprite.anchor.x = 0.5;
            particleSprite.anchor.y = 0.5;
            particleSprite.alpha = 0.80;
            particleSprite.rotation = Math.random() * Math.PI * 2;
            container.addChild(particleSprite);
            particles[i] = {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                dx: 0,
                dy: 0,
                sprite: particleSprite
            };
        }
    }

    function animate($sketchElement, stage, renderer, audioContext) {
        for (var i = 0; i < NUM_PARTICLES; i++) {
            var particle = particles[i];
            var closestParticle = null;
            var closestDist2 = Infinity;
            for (var j = 0; j < NUM_PARTICLES; j++) {
                if (i === j) continue;
                var tempParticle = particles[j];
                var dx = tempParticle.x - particle.x;
                var dy = tempParticle.y - particle.y;
                var dist2 = dx*dx+dy*dy;
                if(closestDist2 > dist2) {
                    closestDist2 = dist2;
                    closestParticle = tempParticle;
                }
            }

            particle.dx += 10 * (closestParticle.x - particle.x) / (1 + Math.sqrt(closestDist2));
            particle.dy += 10 * (closestParticle.y - particle.y) / (1 + Math.sqrt(closestDist2));

            particle.dx *= Math.pow(0.99, TIME_STEP);
            particle.dy *= Math.pow(0.99, TIME_STEP);
            particle.x += particle.dx * TIME_STEP;
            particle.y += particle.dy * TIME_STEP;

            particle.x = particle.x % (canvas.width + 50);
            particle.y = particle.y % (canvas.height + 50);

            particle.sprite.position.x = particle.x;
            particle.sprite.position.y = particle.y;
        }
        renderer.render(stage);
    }

    function mousedown(event) {
        var mouseX = event.offsetX == undefined ? event.originalEvent.layerX : event.offsetX;
        var mouseY = event.offsetY == undefined ? event.originalEvent.layerY : event.offsetY;
    }

    function mousemove(event) {
        var mouseX = event.offsetX == undefined ? event.originalEvent.layerX : event.offsetX;
        var mouseY = event.offsetY == undefined ? event.originalEvent.layerY : event.offsetY;
    }

    function mouseup(event) {
    }

    var sketch5 = {
        init: init,
        animate: animate,
        mousedown: mousedown,
        mousemove: mousemove,
        mouseup: mouseup,
        usePixi: true
    };
    // initializeSketch(sketch5, "forcefield");
})();

