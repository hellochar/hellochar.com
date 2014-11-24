function initializeSketch(sketchId) {
  var $canvasWrapper = $("#"+sketchId);

  var $canvas = $("<canvas></canvas>")
                  .attr("width", $canvasWrapper.width())
                  .attr("height", $canvasWrapper.height())
                  .appendTo($canvasWrapper);
  var context = $canvas[0].getContext('2d');

  window.sketches[sketchId]($canvas[0], context);
}

function sketch1(canvas, context) {
  context.fillStyle = "red";
  context.fillRect(0, 0, 25, 25);
  var time = 0;
  function animate() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    time += 1;
    context.fillRect(time % canvas.width, time % canvas.height, 25, 25);
    requestAnimationFrame(animate);
  }
  
  requestAnimationFrame(animate);
}

function sketch2(canvas, context) {
  context.fillStyle = "blue";
  context.fillRect(25, 25, 100, 100);
}

window.sketches = {"sketch1": sketch1, "sketch2": sketch2};


initializeSketch("sketch1");
initializeSketch("sketch2");
