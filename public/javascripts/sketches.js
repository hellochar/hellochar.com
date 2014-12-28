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

    function setCanvasDimensions($canvas) {
        $canvas.attr("width", $window.width() * 0.9)
               .attr("height", $window.height() * 0.9 - 55);
    }

    function initializeSketch(sketchObj, sketchId) {
      var init = sketchObj.init;
      var animate = sketchObj.animate;
      var sketchHtml = sketchObj.html || DEFAULT_SKETCH_HTML;

      // add sketch element to nav
      var $navElement = $('<li></li>');
      $navElement.text(sketchId)
                 .click(function () {
                     $('html, body').animate({ scrollTop: $sketchElement.offset().top }, 600);
                 })
                 .appendTo($navbarElement);

      // add sketch element to body
      var $sketchElement = $('<div></div>').addClass("sketch-wrapper").attr('id', sketchId);
      $allSketches.append($sketchElement);
      $sketchElement.append(sketchHtml);

      // canvas setup
      var $canvas = $sketchElement.find("canvas");
      ["mousedown", "mouseup", "mousemove"].forEach(function (eventName) {
          if (sketchObj[eventName] != null) {
              $canvas[eventName](sketchObj[eventName]);
          }
      });

      setCanvasDimensions($canvas);
      $window.resize(function() {
          setCanvasDimensions($canvas);
      });

      // initialize and run sketch
      var lastAnimate = (new Date()).getTime();
      function animateAndRequestAnimationFrame() {
          if (isElementOnScreen($sketchElement)) {
              $sketchElement.removeClass("disabled");
              animate($sketchElement, $canvas[0].getContext('2d'));
              var now = (new Date()).getTime();
              var elapsed = now - lastAnimate;
              lastAnimate = now;
              console.log(sketchId, 1000 / elapsed);
          } else {
              $sketchElement.addClass("disabled");
          }
          requestAnimationFrame(animateAndRequestAnimationFrame);
      }
      init($sketchElement, $canvas[0].getContext('2d'));
      animateAndRequestAnimationFrame();
    }

    window.initializeSketch = initializeSketch;
})(window);
