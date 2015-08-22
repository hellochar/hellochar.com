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
        public timeToLive = 6000;
        public time = 0;
        constructor(world: World,
                    public hue: number,
                    position: THREE.Vector2) {
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
            this.timeToLive -= 1;
            this.time -= 1;
            if (this.time <= 0) {
                const position = new THREE.Vector2(this.position.x + 15*Math.random() - 7.5,
                                                   this.position.y + 15*Math.random() - 7.5);
                const hue = clampHue(this.hue + 2*(Math.random() - 0.5) * 0.05);
                const plant = new Plant(this.world, hue, position);
                this.world.add(plant);
                this.time = 800 + Math.random() * 500;
            }

            if (this.timeToLive < 0) {
                this.world.destroy(this);
            }
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

        constructor(public scene: THREE.Scene) {
            // create plants and animals
            const extent = 100;
            for(let i = 0; i < 25; i++) {
                const position = new THREE.Vector2(Math.random() * extent - extent/2,
                                                   Math.random() * extent - extent/2);
                const plant = new Plant(this, Math.random(), position);
                this.add(plant);
            }

            for(let i = 0; i < 5; i++) {
                const position = new THREE.Vector2(Math.random() * extent - extent/2,
                                                   Math.random() * extent - extent/2);
                const animal = new Animal(this, Math.random(), position);
                this.add(animal);
            }
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
                if (Date.now() - now > 8) {
                    break;
                }
            }
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
        camera.position.z = 100;
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
