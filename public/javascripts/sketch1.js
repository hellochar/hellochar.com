(function () {
    /**
     * Execute the program for the given mapping beginning with an initial state.
     *
     * @param {string} program - the string of instructions (each a single character) to take
     * @param {char -> (State) => State) mapping - the mapping from instruction -> function that transforms state and possibly has side effects such as drawing
     * @param {2DRenderingContext} context - canvas context for drawing
     */
    function execute(program, mapping, context) {
        var state = {
            x: 0,
            y: 0,
            angle: 0,
            stack: []
        };
        program.split("").forEach(function (instruction) {
            var fn = mapping[instruction];
            fn && fn(state, context);
        });
    }

    /**
     * @return {Function () => Boolean} a function that, when called, will run execute's for loop one more time. It returns true when done, or false if it has more to go.
     */
    function createExecuteGenerator(program, mapping, context) {
        var state = {
            x: 0,
            y: 0,
            angle: 0,
            stack: []
        };

        function runInstruction() {
            if (runInstruction.index < runInstruction.program.length) {
                var instruction = runInstruction.program.charAt(runInstruction.index);
                var fn = mapping[instruction];
                fn && fn(state, context);
                runInstruction.index += 1;
                if (runInstruction.index < runInstruction.program.length) {
                    return false;
                } else {
                    return true;
                }
            } else {
                return true;
            }
        }
        runInstruction.index = 0;
        runInstruction.program = program;
        return runInstruction;
    };

    /**
     * Transform the program with the given rules.
     *
     * @param {string} program - the string of instructions to transform
     * @param {char -> string} transformationRules - a mapping from instruction -> string that the instruction expands into
     * @returns {string} a new program where each transformed instruction from the original program is concatenated together.
     */
    function transform(program, transformationRules) {
        return program.split("").map(function (instruction) {
            return transformationRules[instruction] || instruction;
        }).join("");
    }


    var program = "a";
    var transformationRules = {
        'a': 'd[rrdablllla]',
        'b': 'drdblda'
    }
    var mapping = {
        'd': function(state, context) {
            var dx = Math.cos(state.angle),
            dy = Math.sin(state.angle);
            var oldX = state.x;
            var oldY = state.y;

            state.x += dx * 10;
            state.y += dy * 10;

            context.strokeStyle = "#1498cc";
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
            state.angle += Math.PI / 16;
        },
        'r': function(state) {
            state.angle -= Math.PI / 16;
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
    var programDisplayElement = $('<div class="program-display"></div>');
    var MILLIS_PER_ITERATION = 1000;
    var executeFn;

    function setExecuteFn(canvas, context) {
        if (program.length > 1e4) {
            program = 'a';
        }
        context.resetTransform();
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.translate(canvas.width/2, canvas.height/2);
        executeFn = createExecuteGenerator(program, mapping, context);
        executeFn.startTime = (new Date()).getTime();
        MILLIS_PER_ITERATION += 1000;
    }

    function init(canvas, context) {
        $(canvas).parent().append(programDisplayElement);
        setExecuteFn(canvas, context);
    }

    function animate(canvas, context) {
        var timeElapsed = (new Date()).getTime() - executeFn.startTime;
        var wantedIndex = Math.floor(Math.min(timeElapsed / MILLIS_PER_ITERATION, 1) * program.length);
        var done = false;
        while (executeFn.index < wantedIndex && !done) {
            done = executeFn();
        }

        var prefix = program.substring(0, executeFn.index);
        var highlightedChar = program.charAt(executeFn.index);
        var suffix = program.substring(executeFn.index + 1);
        programDisplayElement.html(prefix+'<span class="highlighted">'+highlightedChar+'</span>'+suffix);
        console.log(timeElapsed)
        if (timeElapsed > MILLIS_PER_ITERATION + 1000) {
            program = transform(program, transformationRules);
            setExecuteFn(canvas, context);
        }
    }

    var sketch1 = {
        init: init,
        animate: animate
    };
    initializeSketch(sketch1, "sketch1");
})();
