(function () {
    var SpriteSheet = (function() {
        function loadSpritesheetTexture(url, width, height) {
            var texture = THREE.ImageUtils.loadTexture(url);
            texture.magFilter = THREE.NearestFilter;
            texture.repeat.set(1 / width, 1 / height);
            return texture;
        }

        var TEXTURE_TILES = loadSpritesheetTexture("/images/roguelikeSheet_transparent.png", 968, 526);
        var MATERIAL_TILES = new THREE.MeshBasicMaterial({
          map: TEXTURE_TILES,
          transparent: true,
          side: THREE.DoubleSide
        });

        var TEXTURE_CHARACTERS = loadSpritesheetTexture("/images/roguelikeChar_transparent.png", 918, 203);
        var MATERIAL_CHARACTERS = new THREE.MeshBasicMaterial({
          map: TEXTURE_CHARACTERS,
          transparent: true,
          side: THREE.DoubleSide
        });

        function getSpriteGeometry(x, y) {
            var geometry = new THREE.Geometry();
            var k = 1;
            geometry.vertices.push(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(k, 0, 0),
                new THREE.Vector3(k, k, 0),
                new THREE.Vector3(0, k, 0)
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

        function getLandscapeMesh(x, y) {
            var geometry = getSpriteGeometry(x, y);
            return new THREE.Mesh(geometry, MATERIAL_TILES);
        }

        function getCharacterMesh(x, y) {
            var geometry = getSpriteGeometry(x, y);
            return new THREE.Mesh(geometry, MATERIAL_CHARACTERS);
        }

        return {
            getLandscapeMesh: getLandscapeMesh,
            getCharacterMesh: getCharacterMesh,
            getSpriteGeometry: getSpriteGeometry
        };
    })();

    function makeCharacter(position, spritesheetX, spritesheetY) {
        var person = SpriteSheet.getCharacterMesh(spritesheetX, spritesheetY);
        person.position.copy(position);
        person.target = position.clone();
        person.inventory = [
            GameObjects.makeWoodItem(position),
            GameObjects.makeWoodItem(position),
            GameObjects.makeWoodItem(position)
        ];
        person.animate = function(millisElapsed) {
            this.position.x = this.position.x * 0.7 + this.target.x * 0.3;
            this.position.y = this.position.y * 0.7 + this.target.y * 0.3;
        }
        return person;
    }

    var GameObjects = {
        makeGrass: function(position) {
            var shrub = Math.random() < 0.5 ?
                        SpriteSheet.getLandscapeMesh(22, 19) :
                        SpriteSheet.getLandscapeMesh(22, 20);
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
            var tileMesh = SpriteSheet.getLandscapeMesh(3, 17);
            tileMesh.position.copy(position);
            tileMesh.time = 0;
            tileMesh.animate = function(millisElapsed) {
                this.time += millisElapsed;
                if (Math.sin((position.x+position.y) / 5 + this.time / 900) < 0) {
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
            var woodMesh = SpriteSheet.getLandscapeMesh(41, 20);
            woodMesh.position.copy(position);
            woodMesh.scale.set(0.7, 0.7, 1);
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
        outdoorsAmbientAudio.play();

        return {
            play: play
        };
    })();

    var Map = (function() {
        function buildLandscapeSprites(baseLayer, floorLayer, objectLayer, overheadLayer) {
            var width = 15;
            var height = 8;
            var PADDING = 4;

            for (var x = -width - PADDING; x < width + PADDING; x++) {
                for (var y = -height - PADDING; y < height + PADDING; y++) {
                    var base = SpriteSheet.getLandscapeMesh(3, 14);
                    base.position.x = x;
                    base.position.y = y;
                    baseLayer.add(base);
                }
            }

            for (var x = -width - PADDING; x < width + PADDING; x++) {
                for (var y = -height - PADDING + (x%2); y < height + PADDING; y += 2) {
                    if ((x < -width || x > width) ||
                        (y < -height || y > height)) {
                        var treeBottom = SpriteSheet.getLandscapeMesh(13, 19);
                        treeBottom.position.x = x;
                        treeBottom.position.y = y;
                        var treeTop = SpriteSheet.getLandscapeMesh(13, 20);
                        treeTop.position.x = x;
                        treeTop.position.y = y + 1;
                        treeTop.position.z = 1;
                        objectLayer.add(treeBottom);
                        overheadLayer.add(treeTop);
                    }
                }
            }

            function flowerExists(x, y) {
                return Math.sin((x+25)*(y+93) / 2) < -0.5;
            }
            for (var x = -width; x < width; x++) {
                for (var y = -height; y < height; y++) {
                    if (flowerExists(x, y)) {
                        var flower = GameObjects.makeFlower(new THREE.Vector3(x, y, 0));
                        floorLayer.add(flower);
                    }
                }
            }
        }

        return {
            buildLandscapeSprites: buildLandscapeSprites
        };
    })();

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

    // var TILE_GEOMETRIES = [SpriteSheet.getSpriteGeometry(

    // threejs stuff
    var camera;
    var renderer;
    var scene;

    // base: bottom-level tile texture
    // floor: decorations on the base like grass and flowers
    // object: people, items, chairs, rocks
    // overhead: tree tops
    var baseLayer = new THREE.Object3D(),
        floorLayer = new THREE.Object3D(),
        objectLayer = new THREE.Object3D(),
        overheadLayer = new THREE.Object3D();

    var playerMesh;

    function init(_renderer, _audioContext) {
        renderer = _renderer;
        audioContext = _audioContext;
        canvas = _renderer.domElement;

        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(0, 0, 0, 0, 0, 1000);
        camera.position.z = 500;
        camera.lookAt(new THREE.Vector3(0,0,0));
        setCameraDimensions(canvas.width, canvas.height);

        scene.add(baseLayer);
        scene.add(floorLayer);
        scene.add(objectLayer);
        scene.add(overheadLayer);

        window.scene = scene;

        Map.buildLandscapeSprites(baseLayer, floorLayer, objectLayer, overheadLayer);

        scene.add(GameObjects.makeGrass(new THREE.Vector3(0, 0, 0)));
        scene.add(GameObjects.makeGrass(new THREE.Vector3(1, 1, 0)));

        playerMesh = GameObjects.makePerson(new THREE.Vector3(0, 0, 0));
        scene.add(playerMesh);

        scene.add(GameObjects.makeEnemy(new THREE.Vector3(3, 5, 0)));
        scene.add(GameObjects.makeEnemy(new THREE.Vector3(-7, -4, 0)));
    }

    function animate(millisElapsed) {
      camera.position.x = playerMesh.position.x;
      camera.position.y = playerMesh.position.y;
      scene.traverse(function(object) {
          if (object.animate) {
              object.animate(millisElapsed);
          }
      });
      renderer.render(scene, camera);
    }

    var inventoryObject;
    function toggleInventory() {
        Sound.play("inventory_toggle");
        if (inventoryObject != null) {
            scene.remove(inventoryObject);
            inventoryObject = null;
        } else {
            var WIDTH = 5;
            var HEIGHT = 5;
            inventoryObject = new THREE.Object3D();
            for (var x = 0; x < WIDTH; x++) {
                for (var y = 0; y < HEIGHT; y++) {
                    var spritesheetX = 4;
                    var spritesheetY = 4;
                    if (x == 0) {
                        spritesheetX -= 1;
                    }
                    if (x == WIDTH - 1) {
                        spritesheetX += 1;
                    }
                    if (y == 0) {
                        spritesheetY -= 1;
                    }
                    if (y == HEIGHT - 1) {
                        spritesheetY += 1;
                    }
                    var paperMesh = SpriteSheet.getLandscapeMesh(spritesheetX, spritesheetY);
                    paperMesh.position.set(x, y, 0);
                    inventoryObject.add(paperMesh);
                }
            }
            playerMesh.inventory.forEach(function(item, index) {
                var x = index % WIDTH;
                var y = (HEIGHT - 1) - Math.floor(index / WIDTH);
                item.position.set(x  + 0.15, y + 0.15, 1);
                inventoryObject.add(item);
            });
            inventoryObject.animate = function() {
                this.position.set(playerMesh.position.x+1, playerMesh.position.y - (HEIGHT - 1), 100);
            }
            scene.add(inventoryObject);
        }
    }

    function setCameraDimensions(width, height) {
        var extent = 6;
        if (width > height) {
            camera.top = extent;
            camera.bottom = -extent;
            camera.left = -extent * width / height;
            camera.right = extent * width / height;
        } else {
            camera.left = -extent;
            camera.right = extent;
            camera.top = extent * height / width;
            camera.bottom = -extent * height / width;
        }
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
            73: toggleInventory
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


