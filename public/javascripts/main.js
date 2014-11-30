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
  var mapping = {
    'd': function(state) {
      var dx = Math.cos(state.angle),
          dy = Math.sin(state.angle);
      var oldX = state.x;
      var oldY = state.y;

      state.x += dx * 10;
      state.y += dy * 10;

      context.beginPath();
      context.moveTo(oldX, oldY);
      context.lineTo(state.x, state.y);
      context.stroke();
    },
    'm': function(state) {
      var dx = Math.cos(state.angle),
          dy = Math.sin(state.angle);
      state.x += dx * 10;
      state.y += dy * 10;
    },
    'l': function(state) {
      var rand = 1 + Math.random() / 4;
      state.angle += Math.PI / 16 * rand;
    },
    'r': function(state) {
      var rand = 1 + Math.random() / 4;
      state.angle -= Math.PI / 16 * rand;
    },
    '[': function(state) {
      state.stack.push({x: state.x, y : state.y, angle: state.angle });
    },
    ']': function(state) {
      var lastState = state.stack.pop();
      state.x = lastState.x;
      state.y = lastState.y;
      state.angle = lastState.angle;
    }
  }

  window.context = context;

  function execute(program, mapping) {
    var state = {
      x: 0,
      y: 0,
      angle: 0,
      stack: []
    };
    program.split("").forEach(function (instruction) {
      var fn = mapping[instruction];
      fn && fn(state);
    });
  }

  function transform(program, transformationRules) {
    return program.split("").map(function (instruction) {
      return transformationRules[instruction] || instruction;
    }).join("");
  }

  var program = "a";
  var transformationRules = {
    'a': 'd[rrdalllla]'
  }

  function animate() {
    var millisBefore = (new Date()).getTime();
    context.resetTransform();
    context.save();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.translate(canvas.width/2, canvas.height/2);
    context.strokeStyle = "#1498cc";
    execute(program, mapping);
    context.restore();
    context.font = "20px Arial";
    context.fillStyle = "black";
    context.fillText(program, 0, 20);
    program = transform(program, transformationRules);
    var millisAfter = (new Date()).getTime();
    var elapsed = millisAfter - millisBefore;
    console.log(elapsed)
    if (elapsed < 100) {
      setTimeout(animate, 1000);
    }
  }

  animate();
}

function sketch2(canvas, context) {
  context.fillStyle = "blue";
  context.fillRect(25, 25, 100, 100);
}

window.sketches = {"sketch1": sketch1, "sketch2": sketch2};


initializeSketch("sketch1");
initializeSketch("sketch2");
