(function (window) {
    var $allSketches = $(".all-sketches");
    var $navbarElement = $(".nav");
    var $window = $(window);

    function isElementOnScreen(element) {
        var scrollTop = $window.scrollTop(),
            scrollBottom = scrollTop + $window.height();

        var elementTop = element.offset().top;
        var elementBottom = elementTop + element.height();
        var elementMiddle = (elementBottom + elementTop) / 2;

        return scrollTop < elementMiddle && elementMiddle < scrollBottom;
    }

    function setCanvasDimensions(renderer) {
        renderer.setSize($window.width() * 0.9, $window.height() * 0.9 - 110);
    }

    // properties:
    //   sketch: {
    //      animate: function($sketchElement, canvasContext, audioContext),
    //      id: unique string representing the name of this sketch,
    //      init: function($sketchElement, canvasContext, audioContext),
    //      mousedown, mouseup, mousemove: function(event) || [function(event)]
    //      resize: function(width, height),
    //      usePixi: false
    //   },
    function initializeSketch(sketch) {
        var init = sketch.init;

        var renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true, antialias: true });

        // renderer.setPixelRatio(window.devicePixelRatio);

        // add sketch element to nav
        var $navElement = $('<li></li>');
        $navElement
            .text(sketch.id)
            .click(function () {
                $('html, body').animate({ scrollTop: $sketchElement.offset().top }, 600);
            })
            .appendTo($navbarElement);

        // add sketch element to body
        var $sketchElement = $('<div></div>').addClass("sketch-wrapper").attr('id', sketch.id);
        $allSketches.append($sketchElement);
        $sketchElement.append(renderer.domElement);
        setCanvasDimensions(renderer);
        $window.resize(function() {
            setCanvasDimensions(renderer);
            if (sketch.resize != null) {
                sketch.resize(renderer.domElement.width, renderer.domElement.height);
            }
        });

        // canvas setup
        var $canvas = $(renderer.domElement);
        // disable right-click on canvas
        $canvas.on('contextmenu', function (e) {
            return false;
        });
        ["mousedown", "mouseup", "mousemove", "touchstart", "touchmove", "touchend"].forEach(function (eventName) {
            if (sketch[eventName] != null) {
                var eventCallbacks;
                if (!_.isArray(sketch[eventName])) {
                    eventCallbacks = [sketch[eventName]];
                } else {
                    eventCallbacks = sketch[eventName];
                }
                eventCallbacks.forEach(function(cb) {
                    $canvas.on(eventName, cb);
                });
            }
        });

        // initialize and run sketch
        var lastAnimate = (new Date()).getTime();
        function animateAndRequestAnimFrame() {
            if (isElementOnScreen($sketchElement)) {
                $sketchElement.removeClass("disabled");
                audioContextGain.gain.value = 1;
                sketch.animate();
                var now = (new Date()).getTime();
                var elapsed = now - lastAnimate;
                lastAnimate = now;
                console.log(sketch.id, 1000 / elapsed);
            } else {
                $sketchElement.addClass("disabled");
                audioContextGain.gain.value = 0;
            }
            requestAnimationFrame(animateAndRequestAnimFrame);
        }

        var audioContext = new AudioContext();
        var audioContextGain = audioContext.createGain();
        audioContextGain.connect(audioContext.destination);
        audioContext.gain = audioContextGain;
        document.addEventListener("visibilitychange", function() {
            if (document.hidden) {
                audioContextGain.gain.value = 0;
            }
        });

        init(renderer, audioContext);
        animateAndRequestAnimFrame();
    }

    window.initializeSketch = initializeSketch;
})(window);
