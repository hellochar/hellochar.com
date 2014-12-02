function initializeSketch(sketchFn, sketchId) {
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
