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
            var e = 0.07;
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

    var GameObjects = {
        makeShrub: function(position) {
            var shrub = Math.random() < 0.5 ?
                        SpriteSheet.getLandscapeMesh(22, 19) :
                        SpriteSheet.getLandscapeMesh(22, 20);
            shrub.position.copy(position);
            return shrub;
        },
        makePerson: function(position) {
            var person = SpriteSheet.getCharacterMesh(0, 0);
            person.position.copy(position);
            return person;
        }
    };

    var Sound = (function() {
        var walkAudio = new Audio();
        walkAudio.src = "/audio/game_character_walk.wav";
        function playWalkSound(volume) {
            volume = volume || 1;
            walkAudio.volume = volume;
            walkAudio.play();
        }

        return {
            playWalkSound: playWalkSound
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

    var landscape;
    var shrub;

    var personMesh;

    function init(_renderer, _audioContext) {
        renderer = _renderer;
        audioContext = _audioContext;
        canvas = _renderer.domElement;

        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(0, 0, 0, 0, 0, 200);
        camera.position.z = 100;
        camera.lookAt(new THREE.Vector3(0,0,0));
        setCameraDimensions(canvas.width, canvas.height);

        landscape = new THREE.Object3D();
        for (var x = -6; x < 6; x++) {
            for (var y = -6; y < 6; y++) {
                var tileMesh = SpriteSheet.getLandscapeMesh(10, 4);
                tileMesh.position.x = x;
                tileMesh.position.y = y;
                landscape.add(tileMesh);
            }
        }
        window.landscape = landscape;
        scene.add(landscape);

        function landscape2Exists(x, y) {
            return Math.sin((x+25)*(y+93) / 2) < -0.5;
        }
        var landscape2 = new THREE.Object3D();
        /**
         *      2
         *
         * 4    x    1
         *
         *      8
         *
         * add the number if that adjacent square is not part of the landscape
         * the total sum of the adjacent squares is the key into the map below
         */
        // var map = {
        //     0: [3, 14],
        //     1: [4, 14],
        //     2: [3, 15],
        //     3: [4, 15],
        //     4: [2, 14],
        //     5: [3, 14], // tile doesn't exist
        //     6: [2, 15],
        //     7: [3, 14], // tile doesn't exist
        //     8: [3, 13],
        //     9: [4, 13],
        //     10: [3, 14], //tile doesn't exist
        //     11: [
        // };
        for (var x = -6; x < 6; x++) {
            for (var y = -6; y < 6; y++) {
                if (landscape2Exists(x, y)) {
                    var tileMesh = SpriteSheet.getLandscapeMesh(3, 17);
                    tileMesh.position.x = x;
                    tileMesh.position.y = y;
                    landscape2.add(tileMesh);
                }
            }
        }
        scene.add(landscape2);

        shrub = GameObjects.makeShrub(new THREE.Vector3(0, 0, 0));
        scene.add(shrub);
        shrub2 = GameObjects.makeShrub(new THREE.Vector3(1, 1, 0));
        scene.add(shrub2);

        personMesh = GameObjects.makePerson(new THREE.Vector3(0, 0, 0));
        scene.add(personMesh);
    }

    function animate(millisElapsed) {
      camera.position.x = personMesh.position.x;
      camera.position.y = personMesh.position.y;
      scene.traverse(function(object) {
          if (object.animate) {
              object.animate(millisElapsed);
          }
      });
      renderer.render(scene, camera);
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
                personMesh.position.x += x;
                personMesh.position.y += y;
                Sound.playWalkSound();
                event.preventDefault();
            };
        }
        var ACTIONS = {
            37: moveAction(-1, 0),
            38: moveAction(0, 1),
            39: moveAction(1, 0),
            40: moveAction(0, -1)
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


