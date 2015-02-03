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
    //   sketchObj: {
    //      animate: function($sketchElement, canvasContext, audioContext),
    //      html: html string to add to the sketchElement,,
    //      init: function($sketchElement, canvasContext, audioContext),
    //      mousedown, mouseup, mousemove: function(event) || [function(event)]
    //      resize: function(width, height),
    //      usePixi: false
    //   },
    //   sketchId: string
    function initializeSketch(sketchObj, sketchId) {
        var init = sketchObj.init;

        var renderer = new THREE.WebGLRenderer();
        // renderer.setPixelRatio(window.devicePixelRatio);

        // add sketch element to nav
        var $navElement = $('<li></li>');
        $navElement
            .text(sketchId)
            .click(function () {
                $('html, body').animate({ scrollTop: $sketchElement.offset().top }, 600);
            })
            .appendTo($navbarElement);

        // add sketch element to body
        var $sketchElement = $('<div></div>').addClass("sketch-wrapper").attr('id', sketchId);
        $allSketches.append($sketchElement);
        $sketchElement.append(renderer.domElement);
        setCanvasDimensions(renderer);
        $window.resize(function() {
            if (sketchObj.resize != null) {
                sketchObj.resize(renderer.domElement.width, renderer.domElement.height);
            }
        });

        // canvas setup
        var $canvas = $(renderer.domElement);
        // disable right-click on canvas
        $canvas.on('contextmenu', function (e) {
            return false;
        });
        ["mousedown", "mouseup", "mousemove", "touchstart", "touchmove", "touchend"].forEach(function (eventName) {
            if (sketchObj[eventName] != null) {
                var eventCallbacks;
                if (!_.isArray(sketchObj[eventName])) {
                    eventCallbacks = [sketchObj[eventName]];
                } else {
                    eventCallbacks = sketchObj[eventName];
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
                sketchObj.animate();
                var now = (new Date()).getTime();
                var elapsed = now - lastAnimate;
                lastAnimate = now;
                // console.log(sketchId, 1000 / elapsed);
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
