var Game;
(function (Game) {
    var SpriteSheet;
    (function (SpriteSheet) {
        function loadSpriteSheet(url, width, height) {
            var texture = THREE.ImageUtils.loadTexture(url);
            texture.magFilter = THREE.NearestFilter;
            texture.repeat.set(1 / width, 1 / height);
            var material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true
            });
            return material;
        }
        SpriteSheet.loadSpriteSheet = loadSpriteSheet;
        SpriteSheet.MATERIALS = {
            "tiles": loadSpriteSheet("/images/roguelikeSheet_transparent.png", 1024, 512),
            "dungeon": loadSpriteSheet("/images/roguelikeDungeon_transparent.png", 512, 512),
            "characters": loadSpriteSheet("/images/roguelikeChar_transparent.png", 1024, 256)
        };
        var geometryCache = {};
        function getGeometry(x, y) {
            var key = x + "," + y;
            if (geometryCache[key]) {
                return geometryCache[key];
            }
            var geometry = geometryCache[key] = new THREE.Geometry();
            geometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(1, 1, 0), new THREE.Vector3(0, 1, 0));
            geometry.faces.push(new THREE.Face3(0, 1, 2), new THREE.Face3(0, 2, 3));
            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(16 * x, 16 * y),
                new THREE.Vector2(16 * x + 16, 16 * y),
                new THREE.Vector2(16 * x + 16, 16 * y + 16)
            ], [
                new THREE.Vector2(16 * x, 16 * y),
                new THREE.Vector2(16 * x + 16, 16 * y + 16),
                new THREE.Vector2(16 * x, 16 * y + 16)
            ]);
            return geometry;
        }
        SpriteSheet.getGeometry = getGeometry;
        var materialCache = {};
        function getOpaqueMaterialAt(x, y, tileSet) {
            var key = x + "," + y;
            if (materialCache[key]) {
                return materialCache[key];
            }
            var canvas = $("<canvas>").attr("width", 16).attr("height", 16)[0];
            var texture = new THREE.Texture(canvas);
            texture.magFilter = THREE.NearestFilter;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            var sourceTexture = SpriteSheet.MATERIALS[tileSet].map;
            sourceTexture.addEventListener("update", function () {
                var image = sourceTexture.image;
                var context = canvas.getContext("2d");
                context.drawImage(image, 16 * x, image.height - 16 * y - 16, 16, 16, 0, 0, 16, 16);
                texture.needsUpdate = true;
            });
            var material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide
            });
            materialCache[key] = material;
            return material;
        }
        SpriteSheet.getOpaqueMaterialAt = getOpaqueMaterialAt;
        function getMesh(x, y, tileSet) {
            var material = SpriteSheet.MATERIALS[tileSet || "tiles"];
            var geometry = getGeometry(x, y);
            var mesh = new THREE.Mesh(geometry, material);
            return mesh;
        }
        SpriteSheet.getMesh = getMesh;
        function getConnectorTileOffset(floorExists, x, y) {
            var missingTop = !floorExists(x, y + 1), missingRight = !floorExists(x + 1, y), missingBottom = !floorExists(x, y - 1), missingLeft = !floorExists(x - 1, y);
            var index = Number(missingTop) + Number(missingRight) * 2 + Number(missingBottom) * 4 + Number(missingLeft) * 8;
            var offsets = [
                [0, 0],
                [0, 1],
                [1, 0],
                [1, 1],
                [0, -1],
                [1, 2],
                [1, -1],
                [-3, -2],
                [-1, 0],
                [-1, 1],
                [1, 3],
                [-2, -1],
                [-1, -1],
                [-2, -2],
                [-3, -1],
                [0, -2]
            ];
            if (index == 0) {
                if (!floorExists(x + 1, y + 1)) {
                    return [-3, 0];
                }
                else if (!floorExists(x + 1, y - 1)) {
                    return [-3, 1];
                }
                else if (!floorExists(x - 1, y - 1)) {
                    return [-2, 1];
                }
                else if (!floorExists(x - 1, y + 1)) {
                    return [-2, 0];
                }
            }
            return offsets[index];
        }
        SpriteSheet.getConnectorTileOffset = getConnectorTileOffset;
        function getBasicConnectorTileOffset(floorExists, x, y) {
            var missingTop = !floorExists(x, y + 1), missingRight = !floorExists(x + 1, y), missingBottom = !floorExists(x, y - 1), missingLeft = !floorExists(x - 1, y);
            var dx = missingRight ? 1 : missingLeft ? -1 : 0;
            var dy = missingTop ? 1 : missingBottom ? -1 : 0;
            return [dx, dy];
        }
        SpriteSheet.getBasicConnectorTileOffset = getBasicConnectorTileOffset;
    })(SpriteSheet || (SpriteSheet = {}));
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
        person.animate = function (millisElapsed) {
            this.position.lerp(this.target, 0.3);
        };
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
        };
        person.move = function (x, y) {
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
                    break;
                }
                this.moveDepth(1);
                this.energy -= 10;
            }
            HUD.updateEnergyIndicator();
        };
        person.moveDepth(0);
        return person;
    }
    var GameObjects;
    (function (GameObjects) {
        function makeGrass(position) {
            var shrub = Math.random() < 0.5 ?
                SpriteSheet.getMesh(22, 19, "tiles") :
                SpriteSheet.getMesh(22, 20, "tiles");
            shrub.position.copy(position);
            return shrub;
        }
        GameObjects.makeGrass = makeGrass;
        function makePerson(position) {
            return makeCharacter(position, 0, 0);
        }
        GameObjects.makePerson = makePerson;
        function makeEnemy(position) {
            return makeCharacter(position, 1, 10);
        }
        GameObjects.makeEnemy = makeEnemy;
        function makeFlower(position) {
            var tileMesh = SpriteSheet.getMesh(3, 17, "tiles");
            tileMesh.position.copy(position);
            tileMesh.time = 0;
            tileMesh.animate = function (millisElapsed) {
                this.time += millisElapsed;
                if (Math.sin((position.x + position.y * 1.1) / 5 + this.time / 900) < 0) {
                    this.position.x = position.x - 0.02;
                    this.position.y = position.y - 0.02;
                }
                else {
                    this.position.x = position.x + 0.02;
                    this.position.y = position.y + 0.02;
                }
            };
            return tileMesh;
        }
        GameObjects.makeFlower = makeFlower;
        function makeWoodItem(position) {
            var woodMesh = SpriteSheet.getMesh(41, 20, "tiles");
            woodMesh.position.copy(position);
            return woodMesh;
        }
        GameObjects.makeWoodItem = makeWoodItem;
    })(GameObjects || (GameObjects = {}));
    var Sound;
    (function (Sound) {
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
        };
        function play(name) {
            if (audioCache[name]) {
                audioCache[name].play();
            }
        }
        Sound.play = play;
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
    })(Sound || (Sound = {}));
    var Map;
    (function (Map) {
        function buildLevelMesh(depth) {
            function getWantedZ() {
                if (playerMesh.depth <= depth) {
                    return -playerMesh.depth - (depth - playerMesh.depth) * 0.2;
                }
                else {
                    return -depth;
                }
            }
            var level = new THREE.Object3D();
            level.depth = depth;
            level.position.z = getWantedZ();
            level.animate = function (millisElapsed) {
                level.position.z = 0.7 * level.position.z + 0.3 * getWantedZ();
            };
            return level;
        }
        function Level(width, height, depth, generator, getFloorTile) {
            this.width = width;
            this.height = height;
            this.depth = depth;
            this.generator = generator;
            this.getFloorTile = getFloorTile;
            this.mesh = buildLevelMesh(depth);
            this.grid = [];
            this.obstructions = [];
            for (var i = 0; i < this.width * this.height; i++) {
                var x = i % this.width;
                var y = Math.floor(i / this.width);
                this.grid[i] = generator(x, y);
                this.obstructions[i] = false;
            }
            this.updateMesh();
        }
        Level.prototype.obstruct = function (x, y) {
            this.obstructions[y * this.width + x] = true;
        };
        Level.prototype.unobstruct = function (x, y) {
            this.obstructions[y * this.width + x] = false;
        };
        Level.prototype.isObstructed = function (x, y) {
            return this.obstructions[y * this.width + x];
        };
        Level.prototype.get = function (x, y) {
            return this.grid[y * this.width + x];
        };
        Level.prototype.updateMesh = function () {
            var geometry = new THREE.Geometry();
            for (var i = 0; i < this.width * this.height; i++) {
                if (this.grid[i] >= 0) {
                    var x = i % this.width;
                    var y = Math.floor(i / this.width);
                    var vIndex = geometry.vertices.length;
                    geometry.vertices.push(new THREE.Vector3(x, y, 0), new THREE.Vector3(x + 1, y, 0), new THREE.Vector3(x + 1, y + 1, 0), new THREE.Vector3(x, y + 1, 0));
                    geometry.faces.push(new THREE.Face3(vIndex, vIndex + 1, vIndex + 2), new THREE.Face3(vIndex, vIndex + 2, vIndex + 3));
                    geometry.faceVertexUvs[0].push([
                        new THREE.Vector2(0, 0),
                        new THREE.Vector2(1, 0),
                        new THREE.Vector2(1, 1)
                    ], [
                        new THREE.Vector2(0, 0),
                        new THREE.Vector2(1, 1),
                        new THREE.Vector2(0, 1)
                    ]);
                }
            }
            var tile = this.getFloorTile();
            var material = SpriteSheet.getOpaqueMaterialAt(tile[0], tile[1], "tiles");
            var floorMesh = new THREE.Mesh(geometry, material);
            this.mesh.add(floorMesh);
        };
        Level.prototype.addObjects = function (callback, shouldObstruct) {
            for (var i = 0; i < this.width * this.height; i++) {
                var x = i % this.width;
                var y = Math.floor(i / this.width);
                if (this.grid[i] == 0) {
                    var object = callback(x, y);
                    if (object != null) {
                        this.addObject(object, shouldObstruct);
                    }
                }
            }
        };
        Level.prototype.addObject = function (mesh, shouldObstruct) {
            this.mesh.add(mesh);
            if (shouldObstruct) {
                this.obstruct(mesh.x, mesh.y);
            }
        };
        function buildOutdoorsLevel(width, height) {
            function generator(x, y) {
                if (Math.sin(x / 4) * Math.sin(y / 4) > -0.5) {
                    return 0;
                }
                else {
                    return -1;
                }
            }
            function getFloorTile(x, y) {
                return [3, 14];
            }
            var level = new Level(width, height, 0, generator, getFloorTile);
            level.addObjects(function (x, y) {
                var flowerExists = Math.sin((x * 3 + 25.2) * (y * 0.9 + 345.3492) / 2) < -0.99;
                if (flowerExists) {
                    return GameObjects.makeFlower(new THREE.Vector3(x, y, 0));
                }
            }, false);
            level.addObjects(function (x, y) {
                if ((x < 4 || x > width - 4 || y < 4 || y > height - 4) &&
                    (y + x) % 2 == 0) {
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
        Map.buildOutdoorsLevel = buildOutdoorsLevel;
        function buildCaveLevel(width, height, depth) {
            function floorExists(x, y) {
                return Math.sin(x / 5 + 1.2 + depth) * Math.sin(y / 5 + 4.2391 - depth * 2.1) > -0.5;
            }
            function generator(x, y) {
                if (floorExists(x, y)) {
                    return 0;
                }
                else {
                    return -1;
                }
            }
            function getFloorTile(x, y) {
                return [8, 20];
            }
            var level = new Level(width, height, depth, generator, getFloorTile);
            level.addObjects(function (x, y) {
                var offset = SpriteSheet.getConnectorTileOffset(floorExists, x, y);
                if (offset[0] == 0 && offset[1] == 0) {
                    if ((1 + Math.sin((x * 3432394291 * y * depth + 1.23 + depth))) % 1 < 0.05) {
                        var spritesheetY = Math.random() < 0.5 ? 13 : 14;
                        var mushroom = SpriteSheet.getMesh(0, spritesheetY, "dungeon");
                        mushroom.position.set(x, y, 0);
                        return mushroom;
                    }
                }
            });
            return level;
        }
        Map.buildCaveLevel = buildCaveLevel;
        function buildLastLevel(depth) {
            var width = 15;
            var height = 15;
            function generator(x, y) {
                return 0;
            }
            function getFloorTile(x, y) {
                return [6, 28];
            }
            var level = new Level(width, height, depth, generator, getFloorTile);
            function blueMatExists(x, y) {
                return Math.abs(x + 0.5 - width / 2) < 5 && Math.abs(y + 0.5 - height / 2) < 5;
            }
            level.addObjects(function (x, y) {
                if (blueMatExists(x, y)) {
                    var offset = SpriteSheet.getBasicConnectorTileOffset(blueMatExists, x, y);
                    var blueMat = SpriteSheet.getMesh(16 + offset[0], 1 + offset[1], "tiles");
                    blueMat.position.set(x, y, 0);
                    return blueMat;
                }
            });
            level.addObjects(function (x, y) {
                if (x == 0 || x == width - 1 || y == 0 || y == height - 1) {
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
            pictureObject.position.set(Math.floor(width / 2), Math.floor(height / 2), 0.00001);
            level.addObject(pictureObject);
            var tableLeft = SpriteSheet.getMesh(26, 26, "tiles");
            tableLeft.position.set(Math.floor(width / 2) - 1, Math.floor(height / 2), 0);
            level.addObject(tableLeft, true);
            var tableMiddle = SpriteSheet.getMesh(27, 26, "tiles");
            tableMiddle.position.set(Math.floor(width / 2), Math.floor(height / 2), 0);
            level.addObject(tableMiddle, true);
            var tableRight = SpriteSheet.getMesh(27, 24, "tiles");
            tableRight.position.set(Math.floor(width / 2) + 1, Math.floor(height / 2), 0);
            level.addObject(tableRight, true);
            for (var i = 0; i < 3; i++) {
                (function () {
                    var x = Math.floor(width / 2) - 1 + i;
                    var chairFacingDown = SpriteSheet.getMesh(19, 28, "tiles");
                    chairFacingDown.position.set(x, Math.floor(height / 2) + 1, 0);
                    level.addObject(chairFacingDown, true);
                })();
                (function () {
                    var y = Math.floor(height / 2) + (i - 1) * 2;
                    var bedFacingRight = SpriteSheet.getMesh(15, 28, "tiles");
                    bedFacingRight.position.set(2, y, 0);
                    level.addObject(bedFacingRight);
                })();
            }
            return level;
        }
        Map.buildLastLevel = buildLastLevel;
    })(Map || (Map = {}));
    var HUD;
    (function (HUD) {
        var inventoryObject;
        function toggleInventory() {
            Sound.play("inventory_toggle");
            if (inventoryObject != null) {
                playerMesh.remove(inventoryObject);
                inventoryObject = null;
            }
            else {
                var WIDTH = 5;
                var HEIGHT = 5;
                inventoryObject = new THREE.Object3D();
                inventoryObject.position.set(1.05, 0, 0);
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
                playerMesh.inventory.forEach(function (item, index) {
                    var x = index % WIDTH;
                    var y = -Math.floor(index / WIDTH);
                    item.position.set(x, y, 0.01);
                    inventoryObject.add(item);
                });
            }
        }
        HUD.toggleInventory = toggleInventory;
        var energyIndicator;
        function createEnergyIndicator() {
            energyIndicator = $("<div>Energy: <span></span></div>").css({
                position: "absolute",
                top: 50,
                left: 0,
                color: "white",
                "z-index": 1
            });
            document.body.appendChild(energyIndicator[0]);
            updateEnergyIndicator();
        }
        HUD.createEnergyIndicator = createEnergyIndicator;
        function updateEnergyIndicator() {
            energyIndicator.find("span").text(playerMesh.energy + " / " + playerMesh.maxEnergy);
        }
        HUD.updateEnergyIndicator = updateEnergyIndicator;
        var depthIndicator;
        function createDepthIndicator() {
            depthIndicator = $("<div></div>").css({
                position: "absolute",
                top: 75,
                left: 0,
                color: "white",
                "z-index": 1
            });
            document.body.appendChild(depthIndicator[0]);
            updateDepthIndicator();
        }
        HUD.createDepthIndicator = createDepthIndicator;
        function updateDepthIndicator() {
            if (playerMesh.depth === 0) {
                depthIndicator.text("Outdoors");
            }
            else {
                depthIndicator.text("Depth " + playerMesh.depth);
            }
        }
        HUD.updateDepthIndicator = updateDepthIndicator;
    })(HUD || (HUD = {}));
    var audioContext;
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
        var canvas = _renderer.domElement;
        rendererStats = new THREEx.RendererStats();
        rendererStats.domElement.style.position = 'absolute';
        rendererStats.domElement.style.left = '5px';
        rendererStats.domElement.style.bottom = '0px';
        document.body.appendChild(rendererStats.domElement);
        stats = new Stats();
        stats.domElement.style.position = "absolute";
        stats.domElement.style.bottom = "0px";
        stats.domElement.style.left = "100px";
        document.body.appendChild(stats.domElement);
        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x000000, 1, 2);
        camera = new THREE.PerspectiveCamera(165, 1, 0.01, 2);
        setCameraDimensions(canvas.width, canvas.height);
        playerMesh = GameObjects.makePerson(new THREE.Vector3(20, 14, 0.001));
        scene.add(playerMesh);
        playerMesh.add(camera);
        camera.position.set(0.5, 0.5, 1);
        var w = 60;
        var h = 40;
        levels.push(Map.buildOutdoorsLevel(w, h));
        levels.push(Map.buildCaveLevel(w, h, 1));
        levels.push(Map.buildCaveLevel(w, h, 2));
        levels.push(Map.buildCaveLevel(w, h, 3));
        levels.push(Map.buildCaveLevel(w, h, 4));
        levels.push(Map.buildCaveLevel(w, h, 5));
        levels.push(Map.buildCaveLevel(w, h, 6));
        levels.push(Map.buildLastLevel(7));
        levels.forEach(function (level) {
            scene.add(level.mesh);
        });
        scene.add(GameObjects.makeEnemy(new THREE.Vector3(23, 19, 0)));
        scene.add(GameObjects.makeEnemy(new THREE.Vector3(14, 10, 0)));
        HUD.createDepthIndicator();
        HUD.createEnergyIndicator();
    }
    function animate(millisElapsed) {
        stats.begin();
        scene.traverse(function (object) {
            if (object.animate) {
                object.animate(millisElapsed);
            }
        });
        renderer.render(scene, camera);
        stats.end();
        rendererStats.update(renderer);
    }
    function setCameraDimensions(width, height) {
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
            return function () {
                playerMesh.move(x, y);
                event.preventDefault();
            };
        }
        var ACTIONS = {
            37: moveAction(-1, 0),
            38: moveAction(0, 1),
            39: moveAction(1, 0),
            40: moveAction(0, -1),
            73: HUD.toggleInventory,
            74: function () {
                playerMesh.moveDepth(1);
            },
            75: function () {
                playerMesh.moveDepth(-1);
            }
        };
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
})(Game || (Game = {}));
//# sourceMappingURL=game.js.map