module Evolution {
    export class Thing {
        public mesh: THREE.Mesh;
        constructor(public world: World, public position: THREE.Vector2) {}

        public updateMesh() {
            this.mesh.position.set(this.position.x, this.position.y, 0);
        }
    }
    export class Plant extends Thing {
        public mesh: THREE.Mesh;
        constructor(world: World,
                    public hue: number,
                    position: THREE.Vector2) {
            super(world, position);
            const geometry = new THREE.CircleGeometry(1);
            const color = (new THREE.Color()).setHSL(this.hue, 1, 0.5);
            const material = new THREE.MeshBasicMaterial({
                color: color.getHex()
            });
            this.mesh = new THREE.Mesh(geometry, material);
            this.updateMesh();
        }

        public run() {
        }
    }

    export class Animal extends Thing {
        public mesh: THREE.Mesh;
        public health: number = 1000;

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
        }

        public run() {
            this.health -= 1;
            // hungry
            /*if (this.health < 500) {
                // find best food and eat it
                const bestFood = this.world.plants.reduce((bestPlant, currentPlant) => {
                    if ()
                });
            }*/
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

        constructor(scene: THREE.Scene) {
            // create plants and animals
            const extent = 100;
            for(let i = 0; i < 25; i++) {
                const position = new THREE.Vector2(Math.random() * extent - extent/2,
                                                   Math.random() * extent - extent/2);
                const plant = new Plant(this, Math.random(), position);
                this.plants.push(plant);
                scene.add(plant.mesh);
            }

            for(let i = 0; i < 5; i++) {
                const position = new THREE.Vector2(Math.random() * extent - extent/2,
                                                   Math.random() * extent - extent/2);
                const animal = new Animal(this, Math.random(), position);
                this.animals.push(animal);
                scene.add(animal.mesh);
            }
        }

        public run() {
            this.plants.forEach((p) => {
                p.updateMesh();
            });
            this.animals.forEach((a) => {
                a.run();
                a.updateMesh();
            });
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
