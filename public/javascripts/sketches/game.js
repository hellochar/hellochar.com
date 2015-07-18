(function () {
    var SpriteSheet = (function() {
        function load(url, width, height) {
            var texture = THREE.ImageUtils.loadTexture(url);
            texture.magFilter = THREE.NearestFilter;
            texture.repeat.set(1 / width, 1 / height);

            var material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                side: THREE.DoubleSide
            });

            return material;
        }

        var MATERIALS = {
            "tiles": load("/images/roguelikeSheet_transparent.png", 968, 526),
            "dungeon": load("/images/roguelikeDungeon_transparent.png", 492, 305),
            "characters": load("/images/roguelikeChar_transparent.png", 918, 203)
        };

        var geometryCache = {};
        function getGeometry(x, y) {
            var key = x + "," + y;
            if (geometryCache[key]) {
                return geometryCache[key];
            }
            var geometry = geometryCache[key] = new THREE.Geometry();
            geometry.vertices.push(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(1, 0, 0),
                new THREE.Vector3(1, 1, 0),
                new THREE.Vector3(0, 1, 0)
            );
            geometry.faces.push(
                new THREE.Face3(0, 1, 2),
                new THREE.Face3(0, 2, 3)
            );
            // small epsilon to ensure transparency isn't hit
            var e = 0.10;
            geometry.faceVertexUvs[0].push(
                [
                    new THREE.Vector2(e + 17*x     , e + 17*y     ),
                    new THREE.Vector2(-e + 17*x + 16, e + 17*y     ),
                    new THREE.Vector2(-e + 17*x + 16, -e + 17*y + 16)
                ],
                [
                    new THREE.Vector2(e + 17*x     , e + 17*y     ),
                    new THREE.Vector2(-e + 17*x + 16, -e + 17*y + 16),
                    new THREE.Vector2(e + 17*x     , -e + 17*y + 16)
                ]
            );
            return geometry;
        }

        function getMesh(x, y, tileSet) {
            var material = MATERIALS[tileSet || "tiles"];
            var geometry = getGeometry(x, y);
            return new THREE.Mesh(geometry, material);
        }

        // offset from the "center" tile
        /*
         *       1
         *
         *   8   x   2
         *
         *       4
         */
        function getConnectorTileOffset(floorExists, x, y) {
            var missingTop = !floorExists(x, y + 1),
                missingRight = !floorExists(x + 1, y),
                missingBottom = !floorExists(x, y - 1),
                missingLeft = !floorExists(x - 1, y);
            var index = missingTop + missingRight * 2 + missingBottom * 4 + missingLeft * 8;
            var offsets = [
                // 0: no offset
                [0, 0],

                // 1: only top
                [0, 1],

                // 2: only right
                [1, 0],

                // 3: top-right
                [1, 1],

                // 4: only bottom
                [0, -1],

                // 5: top and bottom missing
                [1, 2],

                // 6: bottom and right
                [1, -1],
                
                // 7: top, right, and bottom
                [-3, -2],

                // 8: left only
                [-1, 0],

                // 9: left/top
                [-1, 1],

                // 10: left/right
                [1, 3],

                // 11: left/top/right
                [-2, -1],

                // 12: left/bottom
                [-1, -1],

                // 13: left/bottom/top
                [-2, -2],

                // 14: left/bottom/right
                [-3, -1],

                // 15: left/bottom/right/top
                [0, -2]
            ];

            if (index == 0) {
                if (!floorExists(x + 1, y + 1)) {
                    // top-right corner missing
                    return [-3, 0];
                } else if (!floorExists(x + 1, y - 1)) {
                    // bottom-right corner missing
                    return [-3, 1];
                } else if (!floorExists(x - 1, y - 1)) {
                    // bottom-left corner missing
                    return [-2, 1];
                } else if (!floorExists(x - 1, y + 1)) {
                    // top-left corner missing
                    return [-2, 0];
                }
            }

            return offsets[index];
        }

        function getBasicConnectorTileOffset(floorExists, x, y) {
            var missingTop = !floorExists(x, y + 1),
                missingRight = !floorExists(x + 1, y),
                missingBottom = !floorExists(x, y - 1),
                missingLeft = !floorExists(x - 1, y);

            var dx = missingRight ? 1 : missingLeft ? -1 : 0;
            var dy = missingTop ? 1 : missingBottom ? -1 : 0;

            return [dx, dy];
        }

        return {
            getMesh: getMesh,
            getGeometry: getGeometry,
            getBasicConnectorTileOffset: getBasicConnectorTileOffset,
            getConnectorTileOffset: getConnectorTileOffset
        };
    })();

    function makeCharacter(position, spritesheetX, spritesheetY) {
        var person = SpriteSheet.getMesh(spritesheetX, spritesheetY, "characters");
        person.position.copy(position);
        person.target = position.clone();
        person.depth = 0;
        person.energy = 1000;
        person.maxEnergy = 1000;
        person.inventory = [
            GameObjects.makeWoodItem(position),
            GameObjects.makeWoodItem(position),
            GameObjects.makeWoodItem(position)
        ];
        person.animate = function(millisElapsed) {
            this.position.lerp(this.target, 0.3);
        }
        person.moveDepth = function (d) {
            if (d != 0) {
                if (this.depth + d >= levels.length || this.depth + d < 0) {
                    return;
                }
                Sound.play("character_switch_floors");
                this.depth += d;
                HUD.updateDepthIndicator();
            }
            this.target.z = -this.depth + 0.001;
        }
        person.move = function(x, y) {
            if (levels[this.depth].isObstructed(this.target.x + x, this.target.y + y)) {
                Sound.play("character_walk_fail");
                return;
            }
            Sound.play("character_walk");
            this.target.x += x;
            this.target.y += y;
            this.energy -= 1;
            while (levels[this.depth].get(this.target.x, this.target.y) < 0) {
                if (this.depth >= levels.length - 1) {
                    return;
                }
                this.moveDepth(1);
                this.energy -= 10;
                HUD.updateEnergyIndicator();
            }
        }
        // initialize target z
        person.moveDepth(0);
        return person;
    }

    var GameObjects = {
        makeGrass: function(position) {
            var shrub = Math.random() < 0.5 ?
                        SpriteSheet.getMesh(22, 19, "tiles") :
                        SpriteSheet.getMesh(22, 20, "tiles");
            shrub.position.copy(position);
            return shrub;
        },
        makePerson: function(position) {
            return makeCharacter(position, 0, 0);
        },
        makeEnemy: function(position) {
            return makeCharacter(position, 1, 10);
        },
        makeFlower: function(position) {
            var tileMesh = SpriteSheet.getMesh(3, 17, "tiles");
            tileMesh.position.copy(position);
            tileMesh.time = 0;
            tileMesh.animate = function(millisElapsed) {
                this.time += millisElapsed;
                if (Math.sin((position.x + position.y * 1.1) / 5 + this.time / 900) < 0) {
                    this.position.x = position.x - 0.02;
                    this.position.y = position.y - 0.02;
                } else {
                    this.position.x = position.x + 0.02;
                    this.position.y = position.y + 0.02;
                }
            }
            return tileMesh;
        },
        makeWoodItem: function(position) {
            var woodMesh = SpriteSheet.getMesh(41, 20, "tiles");
            woodMesh.position.copy(position);
            return woodMesh;
        }
    };

    var Sound = (function() {
        function loadAudio(src, volume) {
            var audio = new Audio();
            audio.src = src;
            audio.volume = volume || 1;
            return audio;
        }
        var audioCache = {
            "character_switch_floors": loadAudio("/audio/game_character_switch_floors.wav", 0.2),
            "character_walk": loadAudio("/audio/game_character_walk.wav", 0.5),
            "character_walk_fail": loadAudio("/audio/game_character_walk_fail.wav", 0.5),
            "inventory_toggle": loadAudio("/audio/game_inventory_toggle.wav", 0.05)
        }

        function play(name) {
            if (audioCache[name]) {
                audioCache[name].play();
            }
        }

        //play ambient immediately
        var outdoorsAmbientAudio = new Audio();
        outdoorsAmbientAudio.src = "/audio/game_outdoors_ambient.mp3";
        outdoorsAmbientAudio.loop = true;
        outdoorsAmbientAudio.volume = 0;
        outdoorsAmbientAudio.controls = true;
        outdoorsAmbientAudio.play();
        $(outdoorsAmbientAudio).css({
            position: "absolute",
            top: 0,
            "z-index": 1
        });
        $("body").append(outdoorsAmbientAudio);

        return {
            play: play
        };
    })();

    var Map = (function() {
        function buildLevelMesh(depth) {
            function getWantedZ() {
                if (playerMesh.depth <= depth) {
                    return -playerMesh.depth - (depth - playerMesh.depth) * 0.3;
                } else {
                    return -depth;
                }
            }

            var level = new THREE.Object3D();
            level.depth = depth;
            level.position.z = getWantedZ();
            level.animate = function(millisElapsed) {
                level.position.z = 0.7 * level.position.z + 0.3 * getWantedZ();
            }
            return level;
        }

        function Level(width, height, depth, generator, getFloorMesh) {
            this.width = width;
            this.height = height;
            this.depth = depth;
            this.generator = generator;
            this.getFloorMesh = getFloorMesh;
            this.mesh = buildLevelMesh(depth);

            // -1 = empty space
            // 0 = normal ground
            this.grid = [];
            this.obstructions = [];

            for(var i = 0; i < this.width*this.height; i++) {
                var x = i % this.width;
                var y = Math.floor(i / this.width);
                this.grid[i] = generator(x, y);
                this.obstructions[i] = false;
            }
            this.updateMesh();
        }

        Level.prototype.obstruct = function(x, y) {
            this.obstructions[y*this.width + x] = true;
        }

        Level.prototype.unobstruct = function(x, y) {
            this.obstructions[y*this.width + x] = false;
        }

        Level.prototype.isObstructed = function(x, y) {
            return this.obstructions[y*this.width + x];
        }

        Level.prototype.get = function(x, y) {
            return this.grid[y*this.width + x];
        }

        Level.prototype.updateMesh = function() {
            for(i = 0; i < this.width * this.height; i++) {
                if (this.grid[i] >= 0) {
                    var x = i % this.width;
                    var y = Math.floor(i / this.width);
                    var mesh = this.getFloorMesh(x, y);
                    mesh.position.x = x;
                    mesh.position.y = y;
                    this.mesh.add(mesh);
                }
            }
        }

        Level.prototype.addObjects = function(callback, shouldObstruct) {
            for (var i = 0; i < this.width*this.height; i++) {
                var x = i % this.width;
                var y = Math.floor(i / this.width);
                if (this.grid[i] == 0) {
                    var object = callback(x, y);
                    if (object != null) {
                        this.addObject(object, shouldObstruct);
                    }
                }
            }
        }

        Level.prototype.addObject = function(mesh, shouldObstruct) {
            this.mesh.add(mesh);
            if (shouldObstruct) {
                this.obstruct(mesh.x, mesh.y);
            }
        }

        function buildOutdoorsLevel(width, height) {
            function generator(x, y) {
                if ( Math.sin(x/4)*Math.sin(y/4) > -0.5 ) {
                    return 0;
                } else {
                    return -1;
                }
            }

            function getFloorMesh(x, y) {
                return SpriteSheet.getMesh(3, 14, "tiles");
            }

            var level = new Level(width, height, 0, generator, getFloorMesh);

            level.addObjects(function(x, y) {
                var flowerExists = Math.sin((x*3+25.2)*(y*0.9+345.3492) / 2) < -0.99;
                if (flowerExists) {
                    return GameObjects.makeFlower(new THREE.Vector3(x, y, 0));
                }
            }, false);

            level.addObjects(function(x, y) {
                if ((x < 4 || x > 34 || y < 4 || y > 20) &&
                    (y+x)%2 == 0) {
                    var tree = new THREE.Object3D();
                    tree.position.set(x, y, 0.002);

                    var treeBottom = SpriteSheet.getMesh(13, 19, "tiles");
                    var treeTop = SpriteSheet.getMesh(13, 20, "tiles");
                    treeTop.position.y = 1;

                    tree.add(treeBottom);
                    tree.add(treeTop);
                    return tree;
                }
            }, true);

            return level;
        }

        function buildCaveLevel(width, height, depth) {
            function floorExists(x, y) {
                return Math.sin(x/5 + 1.2 + depth)*Math.sin(y/5 + 4.2391 - depth*2.1) > -0.5;
            }
            function generator(x, y) {
                if( floorExists(x, y) ) {
                    return 0;
                } else {
                    return -1;
                }
            }

            function getFloorMesh(x, y) {
                var offset = SpriteSheet.getConnectorTileOffset(floorExists, x, y);
                return SpriteSheet.getMesh(8 + offset[0], 20 + offset[1], "tiles");
            }

            var level = new Level(width, height, depth, generator, getFloorMesh);

            level.addObjects(function(x, y) {
                var offset = SpriteSheet.getConnectorTileOffset(floorExists, x, y);
                if (offset[0] == 0 && offset[1] == 0) {
                    if((1+Math.sin((x*3432394291*y*depth + 1.23 + depth)))%1 < 0.05) {
                        var spritesheetY = Math.random() < 0.5 ? 13 : 14;
                        var mushroom = SpriteSheet.getMesh(0, spritesheetY, "dungeon");
                        mushroom.position.set(x, y, 0);
                        return mushroom;
                    }
                }
            });

            return level;
        }

        function buildLastLevel(depth) {
            var width = 15;
            var height = 15;
            function generator(x, y) {
                return 0;
            }

            function getFloorMesh(x, y) {
                return SpriteSheet.getMesh(6, 28, "tiles");
            }

            var level = new Level(width, height, depth, generator, getFloorMesh);

            function blueMatExists(x, y) {
                return Math.abs(x + 0.5 - width/2) < 5 && Math.abs(y + 0.5 - height/2) < 5;
            }
            level.addObjects(function(x, y) {
                if (blueMatExists(x, y)) {
                    var offset = SpriteSheet.getBasicConnectorTileOffset(blueMatExists, x, y);
                    var blueMat = SpriteSheet.getMesh(16 + offset[0], 1 + offset[1], "tiles");
                    blueMat.position.set(x, y, 0);
                    return blueMat;
                }
            });

            level.addObjects(function(x, y) {
                if (x == 0 || x == width-1 || y == 0 || y == height - 1) {
                    var xSide = x == 0 ? "left" : x == width - 1 ? "right" : "neither";
                    var ySide = y == 0 ? "bottom" : y == height - 1 ? "top" : "neither";
                    var wall = new THREE.Object3D();
                    wall.position.set(x, y, 0);

                    var wallBasePosition = {
                        "left-bottom": [28, 15],
                        "left-top": null,
                        "left-neither": null,
                        "right-bottom": [30, 15],
                        "right-top": null,
                        "right-neither": null,
                        "neither-top": [27, 15],
                        "neither-bottom": [27, 15]
                    }[xSide + "-" + ySide];
                    if (wallBasePosition != null) {
                        var wallBase = SpriteSheet.getMesh(wallBasePosition[0], wallBasePosition[1], "tiles");
                        wall.add(wallBase);
                    }

                    var wallTopPosition = {
                        "left-bottom": [30, 17],
                        "left-top": [30, 18],
                        "left-neither": [29, 17],
                        "right-bottom": [31, 17],
                        "right-top": [31, 18],
                        "right-neither": [29, 17],
                        "neither-top": [28, 18],
                        "neither-bottom": [28, 18]
                    }[xSide + "-" + ySide];
                    var wallTop = SpriteSheet.getMesh(wallTopPosition[0], wallTopPosition[1], "tiles");
                    wallTop.position.set(0, 1, 0.002);
                    wall.add(wallTop);

                    return wall;
                }
            }, true);

            var pictureObject = SpriteSheet.getMesh(30, 19, "tiles");
            pictureObject.position.set(Math.floor(width/2), Math.floor(height/2), 0.00001);
            level.addObject(pictureObject);

            var tableLeft = SpriteSheet.getMesh(26, 26, "tiles");
            tableLeft.position.set(Math.floor(width/2) - 1, Math.floor(height/2), 0);
            level.addObject(tableLeft, true);

            var tableMiddle = SpriteSheet.getMesh(27, 26, "tiles");
            tableMiddle.position.set(Math.floor(width/2), Math.floor(height/2), 0);
            level.addObject(tableMiddle, true);

            var tableRight = SpriteSheet.getMesh(27, 24, "tiles");
            tableRight.position.set(Math.floor(width/2)+1, Math.floor(height/2), 0);
            level.addObject(tableRight, true);


            for(var i = 0; i < 3; i++) {
                (function() {
                    var x = Math.floor(width/2) - 1 + i;
                    var chairFacingDown = SpriteSheet.getMesh(19, 28, "tiles");
                    chairFacingDown.position.set(x, Math.floor(height/2) + 1, 0);
                    level.addObject(chairFacingDown, true);
                })();

                (function() {
                    var y = Math.floor(height / 2) + (i - 1) * 2;
                    var bedFacingRight = SpriteSheet.getMesh(15, 28, "tiles");
                    bedFacingRight.position.set(2, y, 0);
                    level.addObject(bedFacingRight);
                })();
            }
            return level;
        }

        return {
            Level: Level,
            buildOutdoorsLevel: buildOutdoorsLevel,
            buildCaveLevel: buildCaveLevel,
            buildLastLevel: buildLastLevel
        };
    })();

    var HUD = (function() {
        var inventoryObject;
        function toggleInventory() {
            Sound.play("inventory_toggle");
            if (inventoryObject != null) {
                playerMesh.remove(inventoryObject);
                inventoryObject = null;
            } else {
                var WIDTH = 5;
                var HEIGHT = 5;
                inventoryObject = new THREE.Object3D();
                inventoryObject.position.set(1.05, 0.5, 0);
                inventoryObject.scale.set(0.5, 0.5, 1);
                playerMesh.add(inventoryObject);
                for (var x = 0; x < WIDTH; x++) {
                    for (var y = 0; y > -HEIGHT; y--) {
                        var spritesheetX = 4;
                        var spritesheetY = 4;
                        if (x == 0) {
                            spritesheetX -= 1;
                        }
                        if (x == WIDTH - 1) {
                            spritesheetX += 1;
                        }
                        if (y == 0) {
                            spritesheetY += 1;
                        }
                        if (y == -(HEIGHT - 1)) {
                            spritesheetY -= 1;
                        }
                        var paperMesh = SpriteSheet.getMesh(spritesheetX, spritesheetY, "tiles");
                        paperMesh.position.set(x, y, 0);
                        inventoryObject.add(paperMesh);
                    }
                }
                playerMesh.inventory.forEach(function(item, index) {
                    var x = index % WIDTH;
                    var y = -Math.floor(index / WIDTH);
                    item.position.set(x, y, 0.01);
                    inventoryObject.add(item);
                });
            }
        }

        var energyIndicator;
        function createEnergyIndicator() {
            energyIndicator = $("<div>Energy: <span></span></div>").css({
                position: "absolute",
                top: 50,
                left: 0,
                color: "white",
                "z-index": 1
            });
            document.body.appendChild( energyIndicator[0] );
            updateEnergyIndicator();
        }

        function updateEnergyIndicator() {
            energyIndicator.find("span").text(playerMesh.energy + " / " + playerMesh.maxEnergy);
        }

        var depthIndicator;
        function createDepthIndicator() {
            depthIndicator = $("<div></div>").css({
                position: "absolute",
                top: 75,
                left: 0,
                color: "white",
                "z-index": 1
            });
            document.body.appendChild( depthIndicator[0] );
            updateDepthIndicator();
        }

        function updateDepthIndicator() {
            if (playerMesh.depth === 0) {
                depthIndicator.text("Outdoors");
            } else {
                depthIndicator.text("Depth " + playerMesh.depth);
            }
        }

        return {
            toggleInventory: toggleInventory,
            createDepthIndicator: createDepthIndicator,
            createEnergyIndicator: createEnergyIndicator,
            updateDepthIndicator: updateDepthIndicator,
            updateEnergyIndicator: updateEnergyIndicator,
        }
    })();

    var audioContext;

    // threejs stuff
    var camera;
    var renderer;
    var scene;
    var rendererStats;
    var stats;

    var playerMesh;
    var levels = [];

    function init(_renderer, _audioContext) {
        renderer = _renderer;
        audioContext = _audioContext;
        canvas = _renderer.domElement;

        rendererStats = new THREEx.RendererStats();
        rendererStats.domElement.style.position = 'absolute';
        rendererStats.domElement.style.left = '5px';
        rendererStats.domElement.style.bottom = '0px';
        document.body.appendChild( rendererStats.domElement );

        stats = new Stats();
        stats.domElement.style.position = "absolute";
        stats.domElement.style.bottom = "0px";
        stats.domElement.style.left = "100px";
        document.body.appendChild( stats.domElement );

        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x000000, 1, 4);
        window.scene = scene;
        // camera = new THREE.OrthographicCamera(0, 0, 0, 0, 0.0001, 1000);
        camera = new THREE.PerspectiveCamera(160, 1, 0.01, 10);
        setCameraDimensions(canvas.width, canvas.height);

        playerMesh = GameObjects.makePerson(new THREE.Vector3(20, 14, 0.001));
        scene.add(playerMesh);
        playerMesh.add(camera);
        camera.position.set(0.5, 0.5, 1);

        levels.push(Map.buildOutdoorsLevel(38, 24));
        levels.push(Map.buildCaveLevel(38, 24, 1));
        levels.push(Map.buildCaveLevel(38, 24, 2));
        levels.push(Map.buildCaveLevel(38, 24, 3));
        levels.push(Map.buildLastLevel(4));
        scene.add(levels[0].mesh);
        scene.add(levels[1].mesh);
        scene.add(levels[2].mesh);
        scene.add(levels[3].mesh);
        scene.add(levels[4].mesh);

        scene.add(GameObjects.makeEnemy(new THREE.Vector3(23, 19, 0)));
        scene.add(GameObjects.makeEnemy(new THREE.Vector3(14, 10, 0)));

        HUD.createDepthIndicator();
        HUD.createEnergyIndicator();
    }

    function animate(millisElapsed) {
        stats.begin();
            scene.traverse(function(object) {
                if (object.animate) {
                    object.animate(millisElapsed);
                }
            });
        renderer.render(scene, camera);
        stats.end();
        rendererStats.update(renderer);
    }

    function setCameraDimensions(width, height) {
        // var extent = 6;
        // if (width > height) {
        //     camera.top = extent;
        //     camera.bottom = -extent;
        //     camera.left = -extent * width / height;
        //     camera.right = extent * width / height;
        // } else {
        //     camera.left = -extent;
        //     camera.right = extent;
        //     camera.top = extent * height / width;
        //     camera.bottom = -extent * height / width;
        // }
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    function touchstart(event) {
    }

    function touchmove(event) {
    }

    function touchend(event) {
    }

    function mousedown(event) {
    }

    function mousemove(event) {
    }

    function mouseup(event) {
    }

    function keydown(event) {
        function moveAction(x, y) {
            return function() {
                playerMesh.move(x, y);
                event.preventDefault();
            };
        }
        var ACTIONS = {
            // left
            37: moveAction(-1, 0),

            // up
            38: moveAction(0, 1),

            // right
            39: moveAction(1, 0),

            // down
            40: moveAction(0, -1),

            // 'i'
            73: HUD.toggleInventory,

            // 'j'
            74: function() {
                playerMesh.moveDepth(1);
            },

            // 'k'
            75: function() {
                playerMesh.moveDepth(-1);
            }
        }
        var action = ACTIONS[event.keyCode];
        if (action != null) {
            action();
        }
    }

    function keyup(event) {
    }

    function keypress(event) {
    }

    function resize(width, height) {
      setCameraDimensions(width, height);
    }

    var game = {
        id: "game",
        init: init,
        animate: animate,
        keydown: keydown,
        keyup: keyup,
        keypress: keypress,
        mousedown: mousedown,
        mousemove: mousemove,
        mouseup: mouseup,
        resize: resize,
        touchstart: touchstart,
        touchmove: touchmove,
        touchend: touchend
    };
    window.registerSketch(game);
})();


