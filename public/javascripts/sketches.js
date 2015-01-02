(function (window) {
    var $allSketches = $(".all-sketches");
    var $navbarElement = $(".nav");
    var $window = $(window);

    var DEFAULT_SKETCH_HTML = '<canvas></canvas>';

    function isElementOnScreen(element) {
        var scrollTop = $window.scrollTop(),
            scrollBottom = scrollTop + $window.height();

        var elementTop = element.offset().top;
        var elementBottom = elementTop + element.height();
        var elementMiddle = (elementBottom + elementTop) / 2;

        return scrollTop < elementMiddle && elementMiddle < scrollBottom;
    }

    function setCanvasDimensions($canvasOrRenderer) {
        if ($canvasOrRenderer instanceof PIXI.CanvasRenderer || $canvasOrRenderer instanceof PIXI.WebGLRenderer) {
            var renderer = $canvasOrRenderer;
            renderer.resize($window.width() * 0.9, $window.height() * 0.9 - 55);
        } else {
            var $canvas = $canvasOrRenderer;
            $canvas.attr("width", $window.width() * 0.9)
                   .attr("height", $window.height() * 0.9 - 55);
        }
    }

    function initializeSketch(sketchObj, sketchId) {
        var init = sketchObj.init;
        var animate = sketchObj.animate;
        var sketchHtml = sketchObj.html || DEFAULT_SKETCH_HTML;
        var sketchResizeCallback = sketchObj.resize;
        var usePixi = sketchObj.usePixi || false;

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
        $sketchElement.append(sketchHtml);

        // canvas setup
        var $canvas = $sketchElement.find("canvas:first-of-type");
        ["mousedown", "mouseup", "mousemove"].forEach(function (eventName) {
            if (sketchObj[eventName] != null) {
                var eventCallbacks;
                if (!_.isArray(sketchObj[eventName])) {
                    eventCallbacks = [sketchObj[eventName]];
                } else {
                    eventCallbacks = sketchObj[eventName];
                }
                eventCallbacks.forEach(function(cb) {
                    $canvas[eventName](cb);
                });
            }
        });

        $window.resize(function() {
            if (sketchResizeCallback != null) {
                sketchResizeCallback($window.width(), $window.height());
            }
        });

        var stage, renderer;
        if (usePixi) {
            stage = new PIXI.Stage(0xfcfcfc);
            renderer = PIXI.autoDetectRenderer(1, 1, {
                antialias: true,
                view: $canvas[0]
            });
            setCanvasDimensions(renderer);
            $window.resize(function() { setCanvasDimensions(renderer); });
        } else {
            setCanvasDimensions($canvas);
            $window.resize(function() { setCanvasDimensions($canvas); });
        }

        // initialize and run sketch
        var lastAnimate = (new Date()).getTime();
        function animateAndRequestAnimFrame() {
            if (isElementOnScreen($sketchElement)) {
                $sketchElement.removeClass("disabled");
                if (usePixi) {
                    animate($sketchElement, stage, renderer);
                } else {
                    animate($sketchElement, $canvas[0].getContext('2d'));
                }
                var now = (new Date()).getTime();
                var elapsed = now - lastAnimate;
                lastAnimate = now;
                // console.log(sketchId, 1000 / elapsed);
            } else {
                $sketchElement.addClass("disabled");
            }
            requestAnimFrame(animateAndRequestAnimFrame);
        }
        if (usePixi) {
            init($sketchElement, stage, renderer);
        } else {
            init($sketchElement, $canvas[0].getContext('2d'));
        }
        animateAndRequestAnimFrame();
    }

    window.initializeSketch = initializeSketch;
})(window);
