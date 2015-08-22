var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Evolution;
(function (Evolution) {
    var Thing = (function () {
        function Thing(world, position) {
            this.world = world;
            this.position = position;
        }
        Thing.prototype.updateMesh = function () {
            this.mesh.position.set(this.position.x, this.position.y, 0);
        };
        return Thing;
    })();
    Evolution.Thing = Thing;
    var Plant = (function (_super) {
        __extends(Plant, _super);
        function Plant(world, hue, position) {
            _super.call(this, world, position);
            this.hue = hue;
            var geometry = new THREE.CircleGeometry(1);
            var color = (new THREE.Color()).setHSL(this.hue, 1, 0.5);
            var material = new THREE.MeshBasicMaterial({
                color: color.getHex()
            });
            this.mesh = new THREE.Mesh(geometry, material);
            this.updateMesh();
        }
        Plant.prototype.run = function () {
        };
        return Plant;
    })(Thing);
    Evolution.Plant = Plant;
    var Animal = (function (_super) {
        __extends(Animal, _super);
        function Animal(world, hue, position) {
            _super.call(this, world, position);
            this.hue = hue;
            this.health = 1000;
            var geometry = new THREE.PlaneGeometry(3, 3);
            var color = (new THREE.Color()).setHSL(this.hue, 1, 0.5);
            var material = new THREE.MeshBasicMaterial({
                color: color.getHex()
            });
            this.mesh = new THREE.Mesh(geometry, material);
            this.updateMesh();
        }
        Animal.prototype.run = function () {
            var _this = this;
            this.health -= 1;
            if (this.health < 500) {
                var bestFood = this.world.plants.reduce(function (bestPlant, currentPlant) {
                    var distToBest = _this.position.distanceTo(bestPlant.position);
                    var distToCurr = _this.position.distanceTo(currentPlant.position);
                    if (distToBest < distToCurr) {
                        return bestPlant;
                    }
                    else {
                        return currentPlant;
                    }
                });
                var offset = bestFood.position.clone().sub(this.position);
                if (offset.length() < 1) {
                    this.health += 500;
                    this.world.destroy(bestFood);
                }
                var speed = 0.7;
                offset.setLength(speed);
                this.position.add(offset);
            }
            if (this.health < 0) {
                this.world.destroy(this);
            }
        };
        Animal.prototype.updateMesh = function () {
            _super.prototype.updateMesh.call(this);
            var scale = this.health / 1000;
            this.mesh.scale.set(scale, scale, 1);
        };
        return Animal;
    })(Thing);
    Evolution.Animal = Animal;
    var World = (function () {
        function World(scene) {
            this.scene = scene;
            this.plants = [];
            this.animals = [];
            var extent = 100;
            for (var i = 0; i < 25; i++) {
                var position = new THREE.Vector2(Math.random() * extent - extent / 2, Math.random() * extent - extent / 2);
                var plant = new Plant(this, Math.random(), position);
                this.plants.push(plant);
                scene.add(plant.mesh);
            }
            for (var i = 0; i < 5; i++) {
                var position = new THREE.Vector2(Math.random() * extent - extent / 2, Math.random() * extent - extent / 2);
                var animal = new Animal(this, Math.random(), position);
                this.animals.push(animal);
                scene.add(animal.mesh);
            }
        }
        World.prototype.destroy = function (thing) {
            if (thing instanceof Animal) {
                this.animals.splice(this.animals.indexOf(thing), 1);
                this.scene.remove(thing.mesh);
            }
            if (thing instanceof Plant) {
                this.plants.splice(this.plants.indexOf(thing), 1);
                this.scene.remove(thing.mesh);
            }
        };
        World.prototype.run = function () {
            this.plants.forEach(function (p) {
                p.updateMesh();
            });
            this.animals.forEach(function (a) {
                a.run();
                a.updateMesh();
            });
        };
        return World;
    })();
    Evolution.World = World;
})(Evolution || (Evolution = {}));
var Evolution;
(function (Evolution) {
    var camera;
    var renderer;
    var scene;
    var rendererStats;
    var stats;
    var world;
    function init(_renderer, _audioContext) {
        renderer = _renderer;
        var canvas = _renderer.domElement;
        if (typeof window["THREEx"] !== "undefined") {
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
        world = new Evolution.World(scene);
        camera = new THREE.PerspectiveCamera(60, 1, 1, 1000);
        camera.position.z = 100;
        setCameraDimensions(canvas.width, canvas.height);
    }
    function animate(millisElapsed) {
        stats.begin();
        world.run();
        renderer.render(scene, camera);
        stats.end();
        if (rendererStats != null) {
            rendererStats.update(renderer);
        }
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
    }
    function keyup(event) {
    }
    function keypress(event) {
    }
    function resize(width, height) {
        setCameraDimensions(width, height);
    }
    var evolution = {
        id: "evolution",
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
    window.registerSketch(evolution);
})(Evolution || (Evolution = {}));
//# sourceMappingURL=evolution.js.map