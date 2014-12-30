(function () {
    var NUM_PARTICLES = 15000;
    var TIME_STEP = 1 / 20;
    var GRAVITY_CONSTANT = 100;

    // speed becomes this percentage of its original speed every second
    var PULLING_DRAG_CONSTANT = 0.96075095702;
    var INERTIAL_DRAG_CONSTANT = 0.73913643334;

    var dragConstant = INERTIAL_DRAG_CONSTANT;

    var returnToStartPower = 0;

    var attractor = null;
    var particles = [];

    var html = '<div class="topbar">Click for gravity.<button class="reset">Reset</button></div><canvas></canvas>';

    var canvas;

    function init($sketchElement, stage, renderer) {
        canvas = $sketchElement.find("canvas")[0];
        var particleCanvas = $("<canvas>").attr("width", 3).attr("height", 3)[0];
        var particleCanvasContext = particleCanvas.getContext('2d');
        particleCanvasContext.fillStyle = 'rgba(255, 255, 255, 0.3)';
        particleCanvasContext.fillRect(0.5, 0.5, 2, 2);
        particleCanvasContext.fillRect(1, 1, 1, 1);
        stage.setBackgroundColor(0x000000);

        var particleTexture = PIXI.Texture.fromCanvas(particleCanvas);

        var container = new PIXI.SpriteBatch();
        stage.addChild(container);

        $sketchElement.find(".reset").click(function() {
            for (var i = 0; i < NUM_PARTICLES; i++) {
                particles[i].dx = 0;
                particles[i].dy = 0;
            }
            returnToStartPower = 0.01;
        });

        for( var i = 0; i < NUM_PARTICLES; i++ ) {
            var particleSprite = new PIXI.Sprite(particleTexture);
            container.addChild(particleSprite);
            particles[i] = {
                x: i * canvas.width / NUM_PARTICLES,
                y: canvas.height / 2,
                dx: 0,
                dy: 0,
                sprite: particleSprite
            };
        }
    }

    function animate($sketchElement, stage, renderer) {
        if (returnToStartPower > 0 && returnToStartPower < 1) {
            returnToStartPower *= 1.01;
        }

        for (var i = 0; i < NUM_PARTICLES; i++) {
            var particle = particles[i];
            if (attractor != null) {
                var dx = attractor.x - particle.x;
                var dy = attractor.y - particle.y;
                var length2 = Math.sqrt(dx*dx + dy*dy);
                var forceX = GRAVITY_CONSTANT * dx / length2;
                var forceY = GRAVITY_CONSTANT * dy / length2;

                particle.dx += forceX * TIME_STEP;
                particle.dy += forceY * TIME_STEP;
            }
            particle.dx *= Math.pow(dragConstant, TIME_STEP);
            particle.dy *= Math.pow(dragConstant, TIME_STEP);

            particle.x += particle.dx * TIME_STEP;
            particle.y += particle.dy * TIME_STEP;

            var wantedX = i * canvas.width / NUM_PARTICLES;
            var wantedY = canvas.height / 2;
            if (returnToStartPower > 0) {
                particle.x -= (particle.x - wantedX) * returnToStartPower;
                particle.y -= (particle.y - wantedY) * returnToStartPower;
            }

            particle.sprite.position.x = particle.x;
            particle.sprite.position.y = particle.y;
        }
        renderer.render(stage);
    }

    function mousedown(event) {
        var mouseX = event.offsetX == undefined ? event.originalEvent.layerX : event.offsetX;
        var mouseY = event.offsetY == undefined ? event.originalEvent.layerY : event.offsetY;
        attractor = { x: mouseX, y : mouseY };
        dragConstant = PULLING_DRAG_CONSTANT;
        returnToStartPower = 0;
    }

    function mousemove(event) {
        var mouseX = event.offsetX == undefined ? event.originalEvent.layerX : event.offsetX;
        var mouseY = event.offsetY == undefined ? event.originalEvent.layerY : event.offsetY;
        if (attractor != null) {
            attractor.x = mouseX;
            attractor.y = mouseY;
        }
    }

    function mouseup(event) {
        dragConstant = INERTIAL_DRAG_CONSTANT;
        attractor = null;
    }

    var sketch2 = {
        init: init,
        animate: animate,
        html: html,
        mousedown: mousedown,
        mousemove: mousemove,
        mouseup: mouseup,
        usePixi: true
    };
    initializeSketch(sketch2, "sketch2");
})();
