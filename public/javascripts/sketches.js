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

    function setCanvasDimensions(renderer, sketchElement) {
        renderer.setSize(sketchElement.width(), sketchElement.height());
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

        // add sketch element to nav
        var $navElement = $('<li></li>');
        $navElement
            .text(sketch.id)
            .click(function () {
                $('body').animate({ scrollTop: $sketchElement.offset().top - 55 }, 600);
            })
            .appendTo($navbarElement);

        // add sketch element to body
        var $sketchElement = $('<div></div>').addClass("sketch-wrapper").attr('id', sketch.id);
        $allSketches.append($sketchElement);
        $sketchElement.append(renderer.domElement);
        setCanvasDimensions(renderer, $sketchElement);
        $window.resize(function() {
            setCanvasDimensions(renderer, $sketchElement);
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
            var callback = sketch[eventName];
            if (callback != null) {
                $canvas.on(eventName, callback);
            }
        });
        // prevent scrolling the viewport
        $canvas.on("touchmove", function(event) {
            event.preventDefault();
        });

        var lastTimestamp = 0;
        // initialize and run sketch
        function animateAndRequestAnimFrame(timestamp) {
            var millisElapsed = timestamp - lastTimestamp;
            lastTimestamp = timestamp;
            if (isElementOnScreen($sketchElement)) {
                $sketchElement.removeClass("disabled");
                audioContextGain.gain.value = 1;
                sketch.animate(millisElapsed);
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
        requestAnimationFrame(animateAndRequestAnimFrame);
    }

    window.initializeSketch = initializeSketch;
})(window);
