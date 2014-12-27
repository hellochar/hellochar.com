(function () {
    var frame = 0;
    var canvas;

    // how much the map gets scaled by
    var windSpeed = 0;

    var mouseX;
    var mouseY;

    function map(x, y) {
        var dx = (x - canvas.width / 2 ) / (canvas.width/2);
        var dy = (y - canvas.height / 2 ) / (canvas.width/2);
        var length2 = dx*dx + dy*dy;
        return 0.025 / (1 + Math.exp(-length2 * 40));
    }

    function gradient(x, y) {
        var epsilon = 1e-6;
        var ddx = (map(x + epsilon, y) - map(x, y)) / epsilon;
        var ddy = (map(x, y + epsilon) - map(x, y + epsilon)) / epsilon;

        return [ddx / epsilon, ddy / epsilon];
    }

    function lineToPermutedPoint(ox, oy, nx, ny, context) {
        function permutedPoint(x, y) {
            var grad = gradient(x, y);
            context.lineTo(x + grad[0], y + grad[1]);
        }

        var STEPS = 10;
        for( var t = 0; t < STEPS; t += 1) {
            var percentage = t / STEPS;
            permutedPoint(ox + (nx - ox) * percentage,
                          oy + (ny - oy) * percentage);
        }
    }

    function init($sketchElement, context) {
        canvas = $sketchElement.find("canvas")[0];
    }

    function animate($sketchElement, context) {
        frame++;

        if (Math.random(1) < Math.abs(windSpeed)) {
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        var GRIDSIZE = 50;
        for (var x = -GRIDSIZE + frame % GRIDSIZE; x < canvas.width + GRIDSIZE; x += GRIDSIZE) {
            for (var y = -GRIDSIZE + frame % GRIDSIZE; y < canvas.height + GRIDSIZE; y += GRIDSIZE) {

                var grad = gradient(x, y);
                context.fillStyle = "rgba(0, 0, 0, 0.25)";
                context.beginPath();
                context.moveTo(x + grad[0], y + grad[1]);

                lineToPermutedPoint(x + grad[0], y + grad[0], x + GRIDSIZE, y + GRIDSIZE, context);
                lineToPermutedPoint(x + GRIDSIZE, y + GRIDSIZE, x, y + GRIDSIZE, context);
                lineToPermutedPoint(x, y + GRIDSIZE, x, y, context);
                context.fill();
            }
        }
    }

    function mousemove(event) {
        mouseX = event.offsetX;
        mouseY = event.offsetY;
    }

    var sketch3 = {
        init: init,
        animate: animate,
        mousemove: mousemove
    };
    initializeSketch(sketch3, "sketch3");
})();

