function initializeSketch(sketchFn, sketchId) {
  if (typeof sketchFn === 'object') {
      var init = sketchFn.init;
      var animate = sketchFn.animate;
      sketchFn = function (canvas, context) {
          init(canvas, context);
          function animateAndRequestAnimationFrame() {
              animate(canvas, context);
              requestAnimationFrame(animateAndRequestAnimationFrame);
          }
          animateAndRequestAnimationFrame();
      }
  }
  var $canvasWrapper = $("#"+sketchId);

  var $canvas = $("<canvas></canvas>")
                  .attr("width", $canvasWrapper.width())
                  .attr("height", $canvasWrapper.height())
                  .appendTo($canvasWrapper);
  var context = $canvas[0].getContext('2d');

  $(window).resize(function() {
      $canvas.attr("width", $canvasWrapper.width())
             .attr("height", $canvasWrapper.height());
  });

  sketchFn($canvas[0], context);
}
