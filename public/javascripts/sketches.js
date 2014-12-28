(function (window) {
    var $allSketches = $(".all-sketches");
    var $navbarElement = $(".nav");
    var DEFAULT_SKETCH_HTML = '<canvas></canvas>';

    var $window = $(window);

    function isElementOnScreen(element) {
        var scrollTop = $window.scrollTop(),
            scrollBottom = scrollTop + $window.height();

        var elementTop = element.offset().top;
        var elementBottom = elementTop + element.height();
        var elementMiddle = (elementBottom + elementTop) / 2;

        return scrollTop < elementMiddle && elementMiddle < scrollBottom;
    }

    function initializeSketch(sketchObj, sketchId) {
      var init = sketchObj.init;
      var animate = sketchObj.animate;
      var sketchHtml = sketchObj.html || DEFAULT_SKETCH_HTML;

      var $navElement = $('<li></li>');
      $navElement.text(sketchId)
                 .click(function () {
                     $('html, body').animate({ scrollTop: $sketchElement.offset().top }, 600);
                 })
                 .appendTo($navbarElement);


      var $sketchElement = $('<div></div>').addClass("sketch-wrapper").attr('id', sketchId);
      $allSketches.append($sketchElement);
      $sketchElement.append(sketchHtml);

      var $canvas = $sketchElement.find("canvas")
                      .attr("width", $sketchElement.width())
                      .attr("height", $sketchElement.height())
      var context = $canvas[0].getContext('2d');


      ["mousedown", "mouseup", "mousemove"].forEach(function (eventName) {
          if (sketchObj[eventName] != null) {
              $canvas[eventName](sketchObj[eventName]);
          }
      });

      $(window).resize(function() {
          $canvas.attr("width", $sketchElement.width())
                 .attr("height", $sketchElement.height());
      });

      function animateAndRequestAnimationFrame() {
          if (isElementOnScreen($sketchElement)) {
              $sketchElement.removeClass("disabled");
              var start = (new Date()).getTime();
              animate($sketchElement, context);
              var elapsed = (new Date()).getTime() - start;
              console.log(sketchId, 1000 / elapsed);
          } else {
              $sketchElement.addClass("disabled");
          }
          requestAnimationFrame(animateAndRequestAnimationFrame);
      }
      init($sketchElement, context);
      animateAndRequestAnimationFrame();
    }

    window.initializeSketch = initializeSketch;
})(window);
