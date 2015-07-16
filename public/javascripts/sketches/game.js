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
        function tileOffset(missingTop, missingRight, missingBottom, missingLeft) {
            var index = missingTop + missingRight * 2 + missingBottom * 4 + missingLeft * 8;
            var offsets = [
                // no offset
            ];
        }

        return {
            getMesh: getMesh,
            getGeometry: getGeometry
        };
    })();

    function makeCharacter(position, spritesheetX, spritesheetY) {
        var person = SpriteSheet.getMesh(spritesheetX, spritesheetY, "characters");
        person.position.copy(position);
        person.target = position.clone();
        person.depth = 0;
        person.inventory = [
            GameObjects.makeWoodItem(position),
            GameObjects.makeWoodItem(position),
            GameObjects.makeWoodItem(position)
        ];
        person.animate = function(millisElapsed) {
            this.position.lerp(this.target, 0.3);
        }
        person.moveDepth = function (d) {
            this.depth += d;
            this.target.z = -this.depth + 0.001;
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
        function loadAudio(src) {
            var audio = new Audio();
            audio.src = src;
            return audio;
        }
        var audioCache = {
            "character_switch_floors": loadAudio("/audio/game_character_switch_floors.wav"),
            "character_walk": loadAudio("/audio/game_character_walk.wav"),
            "inventory_toggle": loadAudio("/audio/game_inventory_toggle.wav")
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
        function buildLevel(depth) {
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

        function buildOutdoorsLevel() {
            var level = buildLevel(0);
            var width = 15;
            var height = 8;
            var PADDING = 4;

            function floorExists(x, y) {
                return Math.sin(x/4)*Math.sin(y/4) > -0.5;
            }

            for (var x = -width - PADDING; x < width + PADDING; x++) {
                for (var y = -height - PADDING; y < height + PADDING; y++) {
                    if (floorExists(x, y)) {
                        var base = SpriteSheet.getMesh(3, 14, "tiles");
                        base.position.set(x, y, 0);
                        level.add(base);
                    }
                }
            }

            for (var x = -width - PADDING; x < width + PADDING; x++) {
                for (var y = -height - PADDING + (x%2); y < height + PADDING; y += 2) {
                    if ((x < -width || x > width || y < -height || y > height) &&
                        floorExists(x, y)) {
                        var treeBottom = SpriteSheet.getMesh(13, 19, "tiles");
                        treeBottom.position.set(x, y, 0.002);

                        var treeTop = SpriteSheet.getMesh(13, 20, "tiles");
                        treeTop.position.set(x, y+1, 0.002);

                        level.add(treeBottom);
                        level.add(treeTop);
                    }
                }
            }

            function flowerExists(x, y) {
                return Math.sin((x+25)*(y+93) / 2) < -0.5;
            }
            for (var x = -width; x < width; x++) {
                for (var y = -height; y < height; y++) {
                    if (flowerExists(x, y) && floorExists(x, y)) {
                        var flower = GameObjects.makeFlower(new THREE.Vector3(x, y, 0));
                        level.add(flower);
                    }
                }
            }

            level.add(GameObjects.makeGrass(new THREE.Vector3(0, 0, 0)));
            level.add(GameObjects.makeGrass(new THREE.Vector3(1, 1, 0)));
            return level;
        }

        function buildCaveLevel(depth) {
            var level = buildLevel(depth);
            var width = 15;
            var height = 8;
            var PADDING = 4;

            function floorExists(x, y) {
                return Math.sin(x/5 + 1.2 + depth)*Math.sin(y/5 + 4.2391 - depth*2.1) > -0.5;
            }
            for (var x = -width - PADDING; x < width + PADDING; x++) {
                for (var y = -height - PADDING; y < height + PADDING; y++) {
                    if (floorExists(x, y)) {
                        (function() {
                            // var spritesheetX = 17 + Math.floor(Math.random() * 2);
                            var base = SpriteSheet.getMesh(8, 20, "tiles");
                            base.position.set(x, y, 0);
                            level.add(base);
                        })();

                        (function() {
                            if((1+Math.sin((x*3432394291*y*depth + 1.23 + depth)))%1 < 0.05) {
                                var spritesheetY = Math.random() < 0.5 ? 13 : 14;
                                var mushroom = SpriteSheet.getMesh(0, spritesheetY, "dungeon");
                                mushroom.position.set(x, y, 0);
                                level.add(mushroom);
                            }
                        })();
                    }
                }
            }

            return level;
        }

        var Levels = [];
        function generateLevels() {
            Levels.push(buildOutdoorsLevel());
            Levels.push(buildCaveLevel(1));
            Levels.push(buildCaveLevel(2));
            Levels.push(buildCaveLevel(3));
        }

        return {
            generateLevels: generateLevels,
            Levels: Levels
        };
    })();

    function MapLevel(mapModel) {
        THREE.Object3D.call( this );
        this.mapModel = mapModel;
    }

    MapLevel.prototype = Object.create( THREE.Object3D.prototype );
    MapLevel.prototype.constructor = MapLevel;

    var audioContext;

    // var mapModel = {
    //     width: 10,
    //     height: 10,
    //     layers:
    //     [
    //         [0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    //          0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    //          0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    //          0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    //          0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    //          0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    //          0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    //          0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    //          0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    //          0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //          [
    //     ],
    // };

    // var TILE_GEOMETRIES = [SpriteSheet.getGeometry(

    // threejs stuff
    var camera;
    var renderer;
    var scene;
    var rendererStats;
    var stats;

    var outdoorsLayer = new THREE.Object3D();
    var caveLayer = new THREE.Object3D();

    var playerMesh;

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

        playerMesh = GameObjects.makePerson(new THREE.Vector3(0, 0, 0.001));
        scene.add(playerMesh);
        playerMesh.add(camera);
        camera.position.set(0.5, 0.5, 1);

        Map.generateLevels();
        scene.add(Map.Levels[0]);
        scene.add(Map.Levels[1]);
        scene.add(Map.Levels[2]);
        scene.add(Map.Levels[3]);

        scene.add(GameObjects.makeEnemy(new THREE.Vector3(3, 5, 0)));
        scene.add(GameObjects.makeEnemy(new THREE.Vector3(-7, -4, 0)));
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
                playerMesh.target.x += x;
                playerMesh.target.y += y;
                Sound.play("character_walk");
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
            73: toggleInventory,

            // 'j'
            74: function() {
                Sound.play("character_switch_floors");
                playerMesh.moveDepth(1);
            },

            // 'k'
            75: function() {
                Sound.play("character_switch_floors");
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


