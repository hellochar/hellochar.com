function initializeSketch(sketchObj, sketchId) {
  var init = sketchObj.init;
  var animate = sketchObj.animate;

  var $canvasWrapper = $("#"+sketchId);

  var $canvas = $("<canvas></canvas>")
                  .attr("width", $canvasWrapper.width())
                  .attr("height", $canvasWrapper.height())
                  .appendTo($canvasWrapper);
  var canvas = $canvas[0];
  var context = canvas.getContext('2d');

  $(window).resize(function() {
      $canvas.attr("width", $canvasWrapper.width())
             .attr("height", $canvasWrapper.height());
  });

  function animateAndRequestAnimationFrame() {
      animate(canvas, context);
      requestAnimationFrame(animateAndRequestAnimationFrame);
  }
  init(canvas, context);
  animateAndRequestAnimationFrame();
}
