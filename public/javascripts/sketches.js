(function (window) {

    var DEFAULT_SKETCH_HTML = '<canvas></canvas>';

    function initializeSketch(sketchObj, sketchId) {
      var init = sketchObj.init;
      var animate = sketchObj.animate;
      var sketchHtml = sketchObj.html || DEFAULT_SKETCH_HTML;

      var $sketchElement = $("#"+sketchId);
      $sketchElement.append(sketchHtml);

      var $canvas = $sketchElement.find("canvas")
                      .attr("width", $sketchElement.width())
                      .attr("height", $sketchElement.height())
      var context = $canvas[0].getContext('2d');

      $(window).resize(function() {
          $canvas.attr("width", $sketchElement.width())
                 .attr("height", $sketchElement.height());
      });

      function animateAndRequestAnimationFrame() {
          animate($sketchElement, context);
          requestAnimationFrame(animateAndRequestAnimationFrame);
      }
      init($sketchElement, context);
      animateAndRequestAnimationFrame();
    }

    window.initializeSketch = initializeSketch;
})(window);
