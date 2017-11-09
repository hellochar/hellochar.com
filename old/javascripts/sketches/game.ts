module Game {
    module SpriteSheet {
        export var MATERIALS: {[name: string]: THREE.MeshBasicMaterial};
        export function init() {
            MATERIALS = {
                "tiles": loadSpriteSheet("/images/roguelikeSheet_transparent.png", 1024, 512),
                "dungeon": loadSpriteSheet("/images/roguelikeDungeon_transparent.png", 512, 512),
                "characters": loadSpriteSheet("/images/roguelikeChar_transparent.png", 1024, 256)
            };
        }
        function loadSpriteSheet(url: string, width: number, height: number) {
            var texture = THREE.ImageUtils.loadTexture(url);
            texture.magFilter = THREE.NearestFilter;
            texture.repeat.set(1 / width, 1 / height);

            var material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true
            });

            return material;
        }

        var geometryCache: { [key: string]: THREE.Geometry } = {};
        export function getGeometry(x: number, y: number) {
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
            geometry.faceVertexUvs[0].push(
                [
                    new THREE.Vector2(16 * x, 16 * y),
                    new THREE.Vector2(16 * x + 16, 16 * y),
                    new THREE.Vector2(16 * x + 16, 16 * y + 16)
                ],
                [
                    new THREE.Vector2(16 * x, 16 * y),
                    new THREE.Vector2(16 * x + 16, 16 * y + 16),
                    new THREE.Vector2(16 * x, 16 * y + 16)
                ]
            );
            return geometry;
        }

        var materialCache: { [key: string]: THREE.Material } = {};
        export function getOpaqueMaterialAt(x: number, y: number, tileSet: string) {
            var key = x + "," + y;
            if (materialCache[key]) {
                return materialCache[key];
            }

            var canvas = <HTMLCanvasElement> $("<canvas>").attr("width", 16).attr("height", 16)[0];
            var texture = new THREE.Texture(canvas);
            texture.magFilter = THREE.NearestFilter;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;

            var sourceTexture = MATERIALS[tileSet].map;
            sourceTexture.addEventListener("update", () => {
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

        export function getMesh(x: number, y: number, tileSet: string) {
            var material = MATERIALS[tileSet || "tiles"];
            var geometry = getGeometry(x, y);
            var mesh = <IGameMesh> new THREE.Mesh(geometry, material);
            mesh.name = `${tileSet} - ${x}, ${y}`;
            return mesh;
        }

        interface IExistsGenerator {
            (x: number, y: number): boolean;
        }

        // offset from the "center" tile
        /*
         *       1
         *
         *   8   x   2
         *
         *       4
         */
        export function getConnectorTileOffset(floorExists: IExistsGenerator, x: number, y: number) {
            var missingTop = !floorExists(x, y + 1),
                missingRight = !floorExists(x + 1, y),
                missingBottom = !floorExists(x, y - 1),
                missingLeft = !floorExists(x - 1, y);
            var index = Number(missingTop) + Number(missingRight) * 2 + Number(missingBottom) * 4 + Number(missingLeft) * 8;
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

        export function getBasicConnectorTileOffset(floorExists: IExistsGenerator, x: number, y: number) {
            var missingTop = !floorExists(x, y + 1),
                missingRight = !floorExists(x + 1, y),
                missingBottom = !floorExists(x, y - 1),
                missingLeft = !floorExists(x - 1, y);

            var dx = missingRight ? 1 : missingLeft ? -1 : 0;
            var dy = missingTop ? 1 : missingBottom ? -1 : 0;

            return [dx, dy];
        }
    }

    class Character implements ICharacterModel {
        public mesh: IGameMesh;
        public inventory: IGameMesh[] = [];

        constructor(public position: THREE.Vector3,
            sx: number,
            sy: number,
            public maxEnergy: number = 1000,
            public energy = maxEnergy) {
            this.inventory.push(GameObjects.makeWoodItem(position));
            this.inventory.push(GameObjects.makeWoodItem(position));
            this.inventory.push(GameObjects.makeWoodItem(position));

            this.mesh = <IGameMesh> SpriteSheet.getMesh(sx, sy, "characters");
            this.mesh.position.copy(this.position);
            this.mesh.animate = (millisElapsed) => {
                const target = this.position.clone();
                target.z += .001;
                this.mesh.position.lerp(target, 0.3);
            }
        }


        public moveDepth(d: number) {
            if (d != 0) {
                if (this.position.z + d >= levels.length || this.position.z + d < 0) {
                    return;
                }
                Sound.play("character_switch_floors");
                this.position.z += d;
                HUD.updateDepthIndicator();
            }
        }

        public move(x: number, y: number) {
            if (levels[this.position.z].isObstructed(this.position.x + x, this.position.y + y)) {
                Sound.play("character_walk_fail");
                return;
            }
            Sound.play("character_walk");
            this.position.x += x;
            this.position.y += y;
            this.energy -= 1;
            // fall down when you walk into empty space
            while (levels[this.position.z].get(this.position.x, this.position.y) < 0) {
                if (this.position.z >= levels.length - 1) {
                    break;
                }
                this.moveDepth(1);
                this.energy -= 10;
            }
            HUD.updateEnergyIndicator();
        }
    }

    module GameObjects {
        export function makePerson(position: THREE.Vector3) {
            return new Character(position, 0, 0);
        }
        export function makeEnemy(position: THREE.Vector3) {
            return new Character(position, 1, 10);
        }
        export function makeFlower(position: THREE.Vector3) {
            var tileMesh = SpriteSheet.getMesh(3, 17, "tiles");
            tileMesh.position.copy(position);
            tileMesh.time = 0;
            tileMesh.animate = function(millisElapsed: number) {
                this.time += millisElapsed;
                if (Math.sin((position.x + position.y * 1.1) / 5 + this.time / 900) < 0) {
                    this.position.x = position.x - 0.02;
                    this.position.y = position.y - 0.02;
                } else {
                    this.position.x = position.x + 0.02;
                    this.position.y = position.y + 0.02;
                }
            };

            const flower: IObjectModel = {
                position: position.clone(),
                mesh: tileMesh
            };
            return flower;
        }
        export function makeTree(position: THREE.Vector3) {
            var tree = new THREE.Object3D();
            tree.position.set(position.x, position.y, position.z + 0.002);

            var treeBottom = SpriteSheet.getMesh(13, 19, "tiles");
            var treeTop = SpriteSheet.getMesh(13, 20, "tiles");
            treeTop.position.y = 1;

            tree.add(treeBottom);
            tree.add(treeTop);

            const treeObject: IObjectModel = {
                position: position.clone(),
                mesh: tree
            };
            return treeObject;
        }
        export function makeMushroom(position: THREE.Vector3) {
            var spritesheetY = Math.random() < 0.5 ? 13 : 14;
            var mushroom = SpriteSheet.getMesh(0, spritesheetY, "dungeon");
            mushroom.position.copy(position);

            const mushroomObject: IObjectModel = {
                position: position.clone(),
                mesh: mushroom
            };
            return mushroomObject;
        }
        export function makeDoodad(position: THREE.Vector3, spriteX: number, spriteY: number) {
            const mesh = SpriteSheet.getMesh(spriteX, spriteY, "tiles");
            mesh.position.copy(position);
            const doodad: IDoodadModel = {
                position: position,
                spriteX: spriteX,
                spriteY: spriteY,
                spriteTile: "tiles",
                mesh: mesh
            }
            return doodad;
        }
        export function makeWoodItem(position: THREE.Vector3) {
            var woodMesh = SpriteSheet.getMesh(41, 20, "tiles");
            woodMesh.position.copy(position);
            return woodMesh;
        }
    }

    module Sound {
        var audioCache: { [name: string]: HTMLAudioElement };
        export function init() {
            audioCache = {
                "character_switch_floors": loadAudio("/audio/game_character_switch_floors.wav", 0.2),
                "character_walk": loadAudio("/audio/game_character_walk.wav", 0.5),
                "character_walk_fail": loadAudio("/audio/game_character_walk_fail.wav", 0.5),
                "inventory_toggle": loadAudio("/audio/game_inventory_toggle.wav", 0.05)
            };

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
        }
        function loadAudio(src: string, volume: number = 1) {
            var audio = new Audio();
            audio.src = src;
            audio.volume = volume;
            return audio;
        }

        export function play(name: string) {
            if (audioCache[name]) {
                audioCache[name].play();
            }
        }
    }

    module Map {
        export enum GridCell {
            EMPTY = -1,
            GROUND = 0
        }

        function buildLevelMesh(level: Level, floorTile: number[]) {
            function getWantedZ() {
                if (playerMesh.position.z <= level.depth) {
                    return -playerMesh.position.z - (level.depth - playerMesh.position.z) * 0.2;
                } else {
                    return -level.depth;
                }
            }

            const levelMesh = <IGameMesh> new THREE.Object3D();
            levelMesh.name = "Level " + level.depth;
            levelMesh.position.set(0, 0, getWantedZ());
            levelMesh.animate = function(millisElapsed: number) {
                levelMesh.position.z = 0.7 * levelMesh.position.z + 0.3 * getWantedZ();
            }

            const geometry = new THREE.Geometry();
            for (let i = 0; i < level.width * level.height; i++) {
                if (level.grid[i] === GridCell.GROUND) {
                    const x = i % level.width;
                    const y = Math.floor(i / level.width);

                    const vIndex = geometry.vertices.length;
                    geometry.vertices.push(
                        new THREE.Vector3(x, y, 0),
                        new THREE.Vector3(x + 1, y, 0),
                        new THREE.Vector3(x + 1, y + 1, 0),
                        new THREE.Vector3(x, y + 1, 0)
                    );
                    geometry.faces.push(
                        new THREE.Face3(vIndex, vIndex + 1, vIndex + 2),
                        new THREE.Face3(vIndex, vIndex + 2, vIndex + 3)
                    );
                    geometry.faceVertexUvs[0].push(
                        [
                            new THREE.Vector2(0, 0),
                            new THREE.Vector2(1, 0),
                            new THREE.Vector2(1, 1)
                        ],
                        [
                            new THREE.Vector2(0, 0),
                            new THREE.Vector2(1, 1),
                            new THREE.Vector2(0, 1)
                        ]
                    );
                }
            }
            const material = SpriteSheet.getOpaqueMaterialAt(floorTile[0], floorTile[1], "tiles");
            const floorMesh = new THREE.Mesh(geometry, material);
            floorMesh.name = "Level " + level.depth + " floor";
            levelMesh.add(floorMesh);
            return levelMesh;
        }

        export class Level implements ILevelModel {
            public mesh: IGameMesh;
            public objects: IObjectModel[] = [];
            public grid: GridCell[] = [];
            public obstructions: boolean[] = [];

            constructor(public width: number,
                public height: number,
                public depth: number,
                generator: (x: number, y: number) => GridCell,
                floorTile: number[]) {

                for (var i = 0; i < this.width * this.height; i++) {
                    var x = i % this.width;
                    var y = Math.floor(i / this.width);
                    this.grid[i] = generator(x, y);
                    this.obstructions[i] = false;
                }
                this.mesh = buildLevelMesh(this, floorTile);
            }

            public obstruct(x: number, y: number) {
                this.obstructions[y * this.width + x] = true;
            }

            public unobstruct(x: number, y: number) {
                this.obstructions[y * this.width + x] = false;
            }

            public isObstructed(x: number, y: number) {
                return this.obstructions[y * this.width + x];
            }

            public get(x: number, y: number) {
                return this.grid[y * this.width + x];
            }

            public addObjects(callback: (x: number, y: number) => IObjectModel,
                shouldObstruct?: boolean) {
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
            }

            public addObject(object: IObjectModel, shouldObstruct = false) {
                this.objects.push(object);
                this.mesh.add(object.mesh);
                if (shouldObstruct) {
                    this.obstruct(object.position.x, object.position.y);
                }
            }
        }

        export function buildOutdoorsLevel(width: number, height: number) {
            function generator(x: number, y: number) {
                if (Math.sin(x / 4) * Math.sin(y / 4) > -0.5) {
                    return GridCell.GROUND;
                } else {
                    return GridCell.EMPTY;
                }
            }

            var level = new Level(width, height, 0, generator, [3, 14]);

            level.addObjects((x, y) => {
                var flowerExists = Math.sin((x * 3 + 25.2) * (y * 0.9 + 345.3492) / 2) < -0.99;
                if (flowerExists) {
                    return GameObjects.makeFlower(new THREE.Vector3(x, y, 0));
                }
            }, false);

            level.addObjects((x, y) => {
                if ((x < 4 || x > width - 4 || y < 4 || y > height - 4) &&
                    (y + x) % 2 == 0) {
                    return GameObjects.makeTree(new THREE.Vector3(x, y, 0));
                }
            }, true);

            return level;
        }

        export function buildCaveLevel(width: number, height: number, depth: number) {
            function floorExists(x: number, y: number) {
                return Math.sin(x / 5 + 1.2 + depth) * Math.sin(y / 5 + 4.2391 - depth * 2.1) > -0.5;
            }
            function generator(x: number, y: number) {
                if (floorExists(x, y)) {
                    return GridCell.GROUND;
                } else {
                    return GridCell.EMPTY;
                }
            }

            var level = new Level(width, height, depth, generator, [8, 20]);

            level.addObjects((x, y) => {
                var offset = SpriteSheet.getConnectorTileOffset(floorExists, x, y);
                if (offset[0] == 0 && offset[1] == 0) {
                    if ((1 + Math.sin((x * 3432394291 * y * depth + 1.23 + depth))) % 1 < 0.05) {
                        return GameObjects.makeMushroom(new THREE.Vector3(x, y, 0));
                    }
                }
            });

            return level;
        }

        export function buildLastLevel(depth: number) {
            var width = 15;
            var height = 15;
            function generator(x: number, y: number) {
                return GridCell.GROUND;
            }

            var level = new Level(width, height, depth, generator, [6, 28]);

            function blueMatExists(x: number, y: number) {
                return Math.abs(x + 0.5 - width / 2) < 5 && Math.abs(y + 0.5 - height / 2) < 5;
            }
            level.addObjects((x, y) => {
                if (blueMatExists(x, y)) {
                    const offset = SpriteSheet.getBasicConnectorTileOffset(blueMatExists, x, y);
                    return GameObjects.makeDoodad(new THREE.Vector3(x, y, 0), 16 + offset[0], 1 + offset[1]);
                }
            });

            level.addObjects((x, y) => {
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

                    const wallObject: IObjectModel = {
                        position: new THREE.Vector3(x, y, 0),
                        mesh: wall
                    };
                    return wallObject;
                }
            }, true);


            const cx = Math.floor(width / 2),
                cy = Math.floor(height / 2);
            const tableLeft = GameObjects.makeDoodad(new THREE.Vector3(cx - 1, cy, 0), 26, 26);
            const tableMiddle = GameObjects.makeDoodad(new THREE.Vector3(cx, cy, 0), 27, 26);
            const tableRight = GameObjects.makeDoodad(new THREE.Vector3(cx + 1, cy, 0), 27, 24);
            level.addObject(tableLeft, true);
            level.addObject(tableMiddle, true);
            level.addObject(tableRight, true);

            const picture = GameObjects.makeDoodad(new THREE.Vector3(cx, cy, 0.00001), 30, 19);
            level.addObject(picture);

            for (var i = 0; i < 3; i++) {
                (() => {
                    const x = cx - 1 + i;
                    const chairFacingDown = GameObjects.makeDoodad(new THREE.Vector3(x, cy + 1, 0), 19, 28);
                    level.addObject(chairFacingDown, true);
                })();

                (() => {
                    const y = cy + (i - 1) * 2;
                    const bedFacingRight = GameObjects.makeDoodad(new THREE.Vector3(2, y, 0), 15, 28);
                    level.addObject(bedFacingRight);
                })();
            }
            return level;
        }
    }

    module HUD {
        var inventoryObject;
        export function toggleInventory() {
            Sound.play("inventory_toggle");
            if (inventoryObject != null) {
                playerMesh.mesh.remove(inventoryObject);
                inventoryObject = null;
            } else {
                var WIDTH = 5;
                var HEIGHT = 5;
                inventoryObject = new THREE.Object3D();
                inventoryObject.position.set(1.05, 0, 0);
                playerMesh.mesh.add(inventoryObject);
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
        export function createEnergyIndicator() {
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

        export function updateEnergyIndicator() {
            energyIndicator.find("span").text(playerMesh.energy + " / " + playerMesh.maxEnergy);
        }

        var depthIndicator;
        export function createDepthIndicator() {
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

        export function updateDepthIndicator() {
            if (playerMesh.position.z === 0) {
                depthIndicator.text("Outdoors");
            } else {
                depthIndicator.text("Depth " + playerMesh.position.z);
            }
        }
    }

    // threejs stuff
    var camera: THREE.PerspectiveCamera;
    var renderer: THREE.WebGLRenderer;
    var scene: THREE.Scene;
    var rendererStats: any;
    var stats: any;

    var playerMesh: Character;
    var levels: Map.Level[] = [];

    function init(_renderer: THREE.WebGLRenderer, _audioContext: AudioContext) {
        renderer = _renderer;
        const canvas = _renderer.domElement;
        SpriteSheet.init();
        Sound.init();

        if (typeof (<any>window)["THREEx"] !== "undefined") {
            rendererStats = new THREEx.RendererStats();
            rendererStats.domElement.style.position = 'absolute';
            rendererStats.domElement.style.left = '5px';
            rendererStats.domElement.style.bottom = '0px';
            document.body.appendChild(rendererStats.domElement);
        }

        stats = new Stats();
        stats.domElement.style.position = "absolute";
        stats.domElement.style.bottom = "0px";
        stats.domElement.style.left = "100px";
        document.body.appendChild(stats.domElement);

        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x000000, 1, 2);
        // camera = new THREE.OrthographicCamera(0, 0, 0, 0, 0.0001, 1000);
        camera = new THREE.PerspectiveCamera(165, 1, 0.01, 2);
        setCameraDimensions(canvas.width, canvas.height);

        playerMesh = GameObjects.makePerson(new THREE.Vector3(20, 14, 0.0));
        scene.add(playerMesh.mesh);
        playerMesh.mesh.add(camera);
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
        levels.forEach(function(level) {
            scene.add(level.mesh);
        });

        scene.add(GameObjects.makeEnemy(new THREE.Vector3(23, 19, 0)).mesh);
        scene.add(GameObjects.makeEnemy(new THREE.Vector3(14, 10, 0)).mesh);

        HUD.createDepthIndicator();
        HUD.createEnergyIndicator();
    }

    function animate(millisElapsed: number) {
        stats.begin();
        scene.traverse(function(object: IGameMesh) {
            if (object.animate) {
                object.animate(millisElapsed);
            }
        });
        renderer.render(scene, camera);
        stats.end();
        if (rendererStats != null) {
            rendererStats.update(renderer);
        }
    }

    function setCameraDimensions(width: number, height: number) {
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
        function moveAction(x: number, y: number) {
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

    function resize(width: number, height: number) {
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
}
