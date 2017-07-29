var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Evolution;
(function (Evolution) {
    function clampHue(hue) {
        return ((hue % 1) + 1) % 1;
    }
    function hueDistance(hue1, hue2) {
        var angle1 = hue1 * Math.PI * 2, angle2 = hue2 * Math.PI * 2;
        var vector1 = new THREE.Vector2(Math.cos(angle1), Math.sin(angle1)), vector2 = new THREE.Vector2(Math.cos(angle2), Math.sin(angle2));
        var dot = vector1.dot(vector2);
        var angle = Math.acos(dot);
        var dist = angle / (Math.PI * 2);
    }
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
        function Plant(world, hue, position, health) {
            if (health === void 0) { health = 1000; }
            _super.call(this, world, position);
            this.hue = hue;
            this.health = health;
            this.time = 0;
            this.nutrientsConsumed = 0;
            var color = (new THREE.Color()).setHSL(this.hue, 1, 0.5);
            var material = new THREE.MeshBasicMaterial({
                color: color.getHex()
            });
            this.mesh = new THREE.Mesh(Plant.GEOMETRY, material);
            this.updateMesh();
            this.resetTime();
        }
        Plant.prototype.resetTime = function () {
            this.time = 800 + Math.random() * 500;
        };
        Plant.prototype.run = function (delta) {
            this.time -= delta;
            this.health -= delta;
            var oldHealth = this.health;
            this.health += this.world.requestNutrients(this.position, delta * 1);
            this.health += this.world.requestNutrients(this.position, delta * 0.2, 0, 1);
            this.health += this.world.requestNutrients(this.position, delta * 0.2, 1, 0);
            this.health += this.world.requestNutrients(this.position, delta * 0.2, 0, -1);
            this.health += this.world.requestNutrients(this.position, delta * 0.2, -1, 0);
            this.nutrientsConsumed += (this.health - oldHealth);
            if (this.time <= 0 && this.health > 500) {
                for (var z = 0; z < 1; z++) {
                    var move = 3;
                    var position = new THREE.Vector2(this.position.x + move * (Math.random() - 0.5), this.position.y + move * (Math.random() - 0.5));
                    var hue = clampHue(this.hue + 2 * (Math.random() - 0.5) * 0.05);
                    var newPlantHealth = this.health / 10;
                    var plant = new Plant(this.world, hue, position, newPlantHealth);
                    this.health -= newPlantHealth;
                    this.world.add(plant);
                }
                this.resetTime();
            }
            if (this.health < 0) {
                this.world.destroy(this);
                this.world.requestNutrients(this.position, -this.nutrientsConsumed / 2);
                this.world.requestNutrients(this.position, -this.nutrientsConsumed / 8, 0, 1);
                this.world.requestNutrients(this.position, -this.nutrientsConsumed / 8, 1, 0);
                this.world.requestNutrients(this.position, -this.nutrientsConsumed / 8, 0, -1);
                this.world.requestNutrients(this.position, -this.nutrientsConsumed / 8, -1, 0);
            }
        };
        Plant.prototype.updateMesh = function () {
            _super.prototype.updateMesh.call(this);
            var scale = this.health / 1000;
            this.mesh.scale.set(scale, scale, 1);
        };
        Plant.GEOMETRY = new THREE.CircleGeometry(0.5);
        return Plant;
    })(Thing);
    Evolution.Plant = Plant;
    var Animal = (function (_super) {
        __extends(Animal, _super);
        function Animal(world, hue, position, health) {
            if (health === void 0) { health = 2000; }
            _super.call(this, world, position);
            this.hue = hue;
            this.health = health;
            this.time = 0;
            var geometry = new THREE.PlaneGeometry(3, 3);
            var color = (new THREE.Color()).setHSL(this.hue, 1, 0.5);
            var material = new THREE.MeshBasicMaterial({
                color: color.getHex()
            });
            this.mesh = new THREE.Mesh(geometry, material);
            this.updateMesh();
            this.time = 5000 + Math.random() * 2500;
        }
        Animal.prototype.run = function (delta) {
            var _this = this;
            this.health -= delta;
            this.time -= delta;
            if (this.time <= 0 && this.health > 500) {
                var birthOffset = 3;
                var position = new THREE.Vector2(this.position.x + birthOffset * (Math.random() - 0.5), this.position.y + birthOffset * (Math.random() - 0.5));
                var childHealth = this.health / 2;
                var animal = new Animal(this.world, this.hue, position, childHealth);
                this.world.add(animal);
                this.health -= childHealth;
                this.time = 5000 + Math.random() * 2500;
            }
            if (this.health < 1000) {
                if (this.world.plants.length > 0) {
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
                    if (offset.length() < 1 * delta) {
                        this.health += bestFood.health / 2;
                        bestFood.health /= 2;
                    }
                    else {
                        offset.setLength(Animal.SPEED * delta);
                        this.position.add(offset);
                    }
                }
            }
            else {
                var angle = Math.random() * Math.PI * 2;
                this.position.x += Math.cos(angle) * 0.1 * delta;
                this.position.y += Math.sin(angle) * 0.1 * delta;
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
        Animal.SPEED = 1;
        return Animal;
    })(Thing);
    Evolution.Animal = Animal;
    var World = (function () {
        function World(scene, extent) {
            if (extent === void 0) { extent = 100; }
            this.scene = scene;
            this.extent = extent;
            this.plants = [];
            this.animals = [];
            this.time = 0;
            this.totalNutrients = 0;
            this.nutrients = new Array(extent * extent);
            for (var i = 0; i < extent * extent; i++) {
                this.nutrients[i] = 2000;
            }
            for (var i = 0; i < 10; i++) {
                var position = new THREE.Vector2(Math.random() * extent - extent / 2, Math.random() * extent - extent / 2);
                var plant = new Plant(this, Math.random(), position);
                this.add(plant);
            }
            for (var i = 0; i < 0; i++) {
                var position = new THREE.Vector2(Math.random() * extent - extent / 2, Math.random() * extent - extent / 2);
                var animal = new Animal(this, Math.random(), position);
                this.add(animal);
            }
            var geometry = new THREE.Geometry();
            for (var y = -extent / 2; y < extent / 2; y++) {
                for (var x = -extent / 2; x < extent / 2; x++) {
                    geometry.vertices.push(new THREE.Vector3(x, y, 0));
                    geometry.colors.push(new THREE.Color());
                }
            }
            var material = new THREE.PointCloudMaterial({
                size: 2,
                vertexColors: THREE.VertexColors
            });
            this.nutrientsObject = new THREE.PointCloud(geometry, material);
            this.nutrientsObject.position.z = -1;
            scene.add(this.nutrientsObject);
        }
        World.prototype.requestNutrients = function (position, amount, offsetX, offsetY) {
            if (offsetX === void 0) { offsetX = 0; }
            if (offsetY === void 0) { offsetY = 0; }
            var gridX = Math.floor(position.x + offsetX + this.extent / 2), gridY = Math.floor(position.y + offsetY + this.extent / 2);
            if (gridX < 0 || gridX >= this.extent ||
                gridY < 0 || gridY >= this.extent) {
                return 0;
            }
            var index = gridY * this.extent + gridX;
            var actualAmount = Math.min(amount, this.nutrients[index]);
            this.nutrients[index] = Math.min(this.nutrients[index] - actualAmount, 2000);
            return actualAmount;
        };
        World.prototype.add = function (thing) {
            if (thing instanceof Animal) {
                this.animals.push(thing);
                this.scene.add(thing.mesh);
            }
            if (thing instanceof Plant) {
                this.plants.push(thing);
                this.scene.add(thing.mesh);
            }
        };
        World.prototype.destroy = function (thing) {
            if (thing instanceof Animal) {
                this.animals.splice(this.animals.indexOf(thing), 1);
            }
            if (thing instanceof Plant) {
                this.plants.splice(this.plants.indexOf(thing), 1);
            }
            this.scene.remove(thing.mesh);
        };
        World.prototype.run = function () {
            var _this = this;
            var delta = 450;
            for (var i = 0; i < 1; i++) {
                this.plants.forEach(function (p) {
                    p.run(delta);
                    p.updateMesh();
                });
                this.animals.forEach(function (a) {
                    a.run(delta);
                    a.updateMesh();
                });
                for (var j = 0; j < 10 * delta; j++) {
                    var index = Math.floor(Math.random() * this.nutrients.length);
                    this.nutrients[index] = Math.min(this.nutrients[index] + 10 * this.extent / 100, 2000);
                }
                this.time += delta;
            }
            var richColor = new THREE.Color("#15711E");
            var barrenColor = new THREE.Color("#906D22");
            this.totalNutrients = 0;
            this.nutrientsObject.geometry.colors.forEach(function (color, index) {
                var nutrients = _this.nutrients[index];
                color.set("#906D22");
                color.lerp(richColor, nutrients / 2000);
                _this.totalNutrients += nutrients;
            });
            if (this.plants.length > 0) {
                console.log(this.time + ", " + this.totalNutrients);
            }
            this.nutrientsObject.geometry.colorsNeedUpdate = true;
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
        camera.position.z = world.extent;
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