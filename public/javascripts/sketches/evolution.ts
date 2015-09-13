module Evolution {
    function clampHue(hue: number) {
        return ((hue % 1) + 1) % 1;
    }

    // returns from 0 to 0.5, where 0.5 is directly opposing hues
    function hueDistance(hue1: number, hue2: number) {
        const angle1 = hue1 * Math.PI*2,
              angle2 = hue2 * Math.PI*2;

        const vector1 = new THREE.Vector2(Math.cos(angle1), Math.sin(angle1)),
              vector2 = new THREE.Vector2(Math.cos(angle2), Math.sin(angle2));

        const dot = vector1.dot(vector2);
        const angle = Math.acos(dot);
        const dist = angle / (Math.PI * 2);
    }

    export class Thing {
        public mesh: THREE.Mesh;
        constructor(public world: World, public position: THREE.Vector2) {}

        public updateMesh() {
            this.mesh.position.set(this.position.x, this.position.y, 0);
        }
    }

    export class Plant extends Thing {
        public time = 0;

        constructor(world: World,
                    public hue: number,
                    position: THREE.Vector2,
                    public health = 1000) {
            super(world, position);
            const geometry = new THREE.CircleGeometry(0.5);
            const color = (new THREE.Color()).setHSL(this.hue, 1, 0.5);
            const material = new THREE.MeshBasicMaterial({
                color: color.getHex()
            });
            this.mesh = new THREE.Mesh(geometry, material);
            this.updateMesh();

            this.time = 800 + Math.random() * 500;
        }

        public run() {
            this.time -= 1;
            this.health -= 1;
            this.health += this.world.requestNutrients(this.position, 1);
            this.health += this.world.requestNutrients(this.position, 0.25, 0, 1);
            this.health += this.world.requestNutrients(this.position, 0.25, 1, 0);
            this.health += this.world.requestNutrients(this.position, 0.25, 0, -1);
            this.health += this.world.requestNutrients(this.position, 0.25, -1, 0);
            if (this.time <= 0) {
                const position = new THREE.Vector2(this.position.x + 15*Math.random() - 7.5,
                                                   this.position.y + 15*Math.random() - 7.5);
                const hue = clampHue(this.hue + 2*(Math.random() - 0.5) * 0.05);
                const newPlantHealth = this.health / 10;
                const plant = new Plant(this.world, hue, position, newPlantHealth);
                this.health -= newPlantHealth;
                this.world.add(plant);
                this.time = 800 + Math.random() * 500;
            }

            if (this.health < 0) {
                this.world.destroy(this);
            }
        }

        public updateMesh() {
            super.updateMesh();
            const scale = this.health / 1000;
            this.mesh.scale.set(scale, scale, 1);
        }
    }

    export class Animal extends Thing {
        public health: number = 1000;
        public time = 0;

        constructor(world: World,
                    public hue: number,
                    position: THREE.Vector2) {
            super(world, position);

            const geometry = new THREE.PlaneGeometry(3, 3);
            const color = (new THREE.Color()).setHSL(this.hue, 1, 0.5);
            const material = new THREE.MeshBasicMaterial({
                color: color.getHex()
            });
            this.mesh = new THREE.Mesh(geometry, material);
            this.updateMesh();

            this.time = 2500 + Math.random() * 2500;
        }

        public run() {
            this.health -= 1;
            this.time -= 1;
            // give birth
            if (this.time <= 0) {
                const position = new THREE.Vector2(this.position.x + 15*Math.random() - 7.5,
                                                   this.position.y + 15*Math.random() - 7.5);
                const animal = new Animal(this.world, this.hue, position);
                this.world.add(animal);

                this.time = 2500 + Math.random() * 2500;
            }
            // hungry
            if (this.health < 500) {
                // find best food and eat it
                if (this.world.plants.length > 0) {
                    const bestFood = this.world.plants.reduce((bestPlant, currentPlant) => {
                        const distToBest = this.position.distanceTo(bestPlant.position);
                        const distToCurr = this.position.distanceTo(currentPlant.position);
                        if (distToBest < distToCurr) {
                            return bestPlant;
                        } else {
                            return currentPlant;
                        }
                    });
                    const offset = bestFood.position.clone().sub(this.position);

                    // if within 1, eat it
                    if (offset.length() < 1) {
                        this.health += 500;
                        this.world.destroy(bestFood);
                    }

                    const speed = 0.7;
                    offset.setLength(speed);

                    this.position.add(offset);
                }
            }

            if (this.health < 0) {
                this.world.destroy(this);
            }
        }

        public updateMesh() {
            super.updateMesh();
            const scale = this.health / 1000;
            this.mesh.scale.set(scale, scale, 1);
        }
    }

    export class World {
        public plants: Plant[] = [];
        public animals: Animal[] = [];
        public nutrients: number[];
        private nutrientsObject: THREE.PointCloud;

        constructor(public scene: THREE.Scene, public extent: number = 100) {
            this.nutrients = new Array(extent * extent);
            for(let i = 0; i < extent*extent; i++) {
                this.nutrients[i] = 1000;
            }
            // create plants and animals
            for(let i = 0; i < 1; i++) {
                /*const position = new THREE.Vector2(Math.random() * extent - extent/2,
                                                   Math.random() * extent - extent/2);*/
                const position = new THREE.Vector2(0, 0);

                const plant = new Plant(this, Math.random(), position);
                this.add(plant);
            }

            for(let i = 0; i < 0; i++) {
                const position = new THREE.Vector2(Math.random() * extent - extent/2,
                                                   Math.random() * extent - extent/2);
                const animal = new Animal(this, Math.random(), position);
                this.add(animal);
            }

            /*const geometry = new THREE.PlaneGeometry(extent-1, extent-1, extent-1, extent-1);*/
            /*for (let i = 0; i < extent*extent; i++) {
                geometry.colors.push(new THREE.Color());
            }*/
            const geometry = new THREE.Geometry();
            for(let y = -extent/2; y < extent/2; y++) {
                for(let x = -extent/2; x < extent/2; x++) {
                    geometry.vertices.push(new THREE.Vector3(x, y, 0));
                    geometry.colors.push(new THREE.Color());
                }
            }
            const material = new THREE.PointCloudMaterial({
                size: 2,
                vertexColors: THREE.VertexColors
            })
            this.nutrientsObject = new THREE.PointCloud(geometry, material);
            this.nutrientsObject.position.z = -1;
            scene.add(this.nutrientsObject);
        }

        public requestNutrients(position: THREE.Vector2, amount: number, offsetX = 0, offsetY = 0) {
            const gridX = Math.floor(position.x + offsetX + this.extent / 2),
                  gridY = Math.floor(position.y + offsetY + this.extent / 2);
            if (gridX < 0 || gridX >= this.extent ||
                gridY < 0 || gridY >= this.extent) {
                return 0;
            }
            const index = gridY * this.extent + gridX;
            const actualAmount = Math.min(amount, this.nutrients[index]);
            this.nutrients[index] -= actualAmount;
            return actualAmount;
        }

        public add(thing: Thing) {
            if (thing instanceof Animal) {
                this.animals.push(thing);
                this.scene.add(thing.mesh);
            }
            if (thing instanceof Plant) {
                this.plants.push(thing);
                this.scene.add(thing.mesh);
            }
        }

        public destroy(thing: Thing) {
            if (thing instanceof Animal) {
                this.animals.splice(this.animals.indexOf(thing), 1);
                this.scene.remove(thing.mesh);
            }
            if (thing instanceof Plant) {
                this.plants.splice(this.plants.indexOf(thing), 1);
                this.scene.remove(thing.mesh);
            }
        }

        public run() {
            let now = Date.now();
            for (let i = 0; i < 100; i++) {
                this.plants.forEach((p) => {
                    p.run();
                    p.updateMesh();
                });
                this.animals.forEach((a) => {
                    a.run();
                    a.updateMesh();
                });
                // add nutrients to 10 random spots every frame
                for(let j = 0; j < 10; j++) {
                    const index = Math.floor(Math.random() * this.nutrients.length);
                    this.nutrients[index] = Math.min(this.nutrients[index] + 10, 2000);
                }
                if (Date.now() - now > 0) {
                    break;
                }
            }
            const richColor = new THREE.Color("#15711E");
            const barrenColor = new THREE.Color("#906D22");
            this.nutrientsObject.geometry.colors.forEach((color, index) => {
                const nutrients = this.nutrients[index];
                color.set("#906D22");
                color.lerp(richColor, nutrients / 2000);
                /*color.setHSL(0, 0, nutrients / 1000);*/
            });
            this.nutrientsObject.geometry.colorsNeedUpdate = true;
        }
    }
}

module Evolution {

    // threejs stuff
    var camera: THREE.PerspectiveCamera;
    var renderer: THREE.WebGLRenderer;
    var scene: THREE.Scene;
    var rendererStats: any;
    var stats: any;

    let world: World;

    function init(_renderer: THREE.WebGLRenderer, _audioContext: AudioContext) {
        renderer = _renderer;
        const canvas = _renderer.domElement;

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

        world = new World(scene);

        camera = new THREE.PerspectiveCamera(60, 1, 1, 1000);
        camera.position.z = world.extent;
        setCameraDimensions(canvas.width, canvas.height);
    }

    function animate(millisElapsed: number) {
        stats.begin();
        world.run();
        renderer.render(scene, camera);
        stats.end();
        if (rendererStats != null) {
            rendererStats.update(renderer);
        }
    }

    function setCameraDimensions(width: number, height: number) {
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

    function resize(width: number, height: number) {
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
}
