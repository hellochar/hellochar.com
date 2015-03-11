(function () {
    var VARIATIONS = {
        Linear: function(point) {
            // no op
        },
        Sinusoidal: function(point) {
            point.set(Math.sin(point.x), Math.sin(point.y), 0);
        },
        Spherical: function(point) {
            point.multiplyScalar(1 / point.lengthSq());
        },
        Polar: function(point) {
            point.set(Math.atan2(point.y, point.x) / Math.PI, point.length() - 1, 0);
        },
        interpolated: function(variationA, variationB, interpolationFn) {
            return function(pointA) {
                var pointB = pointA.clone();
                variationA(pointA);
                variationB(pointB);
                var interpolatedAmount = interpolationFn();
                pointA.lerp(pointB, interpolatedAmount);
            };
        }
    };

    function AffineSet(affines) {
        this.affines = affines;
        this.totalWeight = this.affines.map(function (affine) { return affine.weight; }).reduce(function(x,y) { return x+y; });
    }

    AffineSet.prototype.choose = function() {
        var weight = Math.random() * this.totalWeight;
        var chosenAffine = null;
        this.affines.reduce(function (oldWeightSum, thisAffine) {
            if (oldWeightSum < weight && weight <= thisAffine.weight + oldWeightSum + 1e-10) {
                chosenAffine = thisAffine;
            };
            return thisAffine.weight + oldWeightSum;
        }, 0);
        return chosenAffine;
    }

    AffineSet.prototype.step = function(point, color) {
        var affine = this.choose();
        // apply the affine transform to the point
        affine.transform(point);

        // apply the nonlinear variation to the point
        affine.variation(point);

        // interpolate towards the affine color
        // color.lerp(affine.color, 0.5);
        color.add(affine.color);
    }

    var SERPINSKI_TRIANGLE = new AffineSet([
        {
            color: new THREE.Color(0xff8888),
            weight: 1,
            transform: function(point) {
                point.set((cX + point.x) / 2, (cY+point.y) / 2, 0);
            },
            variation: VARIATIONS.Linear
        },
        {
            color: new THREE.Color("green"),
            weight: 1,
            transform: function(point) {
                point.set( (-1 + point.x) / 2, (-1 + point.y) / 2, 0);
            },
            variation: VARIATIONS.Spherical
        },
        {
            color: new THREE.Color("blue"),
            weight: 1,
            transform: function(point) {
                point.set( (1 + point.x) / 2, (-1 + point.y) / 2, 0);
            },
            variation: VARIATIONS.Polar
        },
    ]);

    var scene, renderer, camera, geometry, pointCloud;

    function init(_renderer, _audioContext) {
        scene = new THREE.Scene();

        renderer = _renderer;

        var aspectRatio = renderer.domElement.height / renderer.domElement.width;
        camera = new THREE.OrthographicCamera(-1.1, 1.1, -1.1*aspectRatio, 1.1*aspectRatio, 1, 1000);
        camera.position.z = 500;

        geometry = new THREE.Geometry();
        for(var i = 0; i < 3000; i++) {
            var position = new THREE.Vector3(Math.random()*2 - 1, Math.random()*2 - 1, 0);
            var color = new THREE.Color();
            geometry.vertices.push(position);
            geometry.colors.push(color);
        }

        var material = new THREE.PointCloudMaterial({
            vertexColors: THREE.VertexColors,
            size: 1,
            sizeAttenuation: false
        });

        pointCloud = new THREE.PointCloud(geometry, material);
        scene.add(pointCloud);
    }

    function animate() {
        geometry.vertices.forEach(function (point, idx) {
            var color = geometry.colors[idx];
            color.setRGB(0,0,0);
            SERPINSKI_TRIANGLE.step(point, color);
        });
        geometry.verticesNeedUpdate = true;
        renderer.render(scene, camera);
    }

    var cX = 0, cY = 0;
    function mousemove(event) {
        var mouseX = event.offsetX == undefined ? event.originalEvent.layerX : event.offsetX;
        var mouseY = event.offsetY == undefined ? event.originalEvent.layerY : event.offsetY;

        cX = Math.map(mouseX, 0, renderer.domElement.width, -1, 1);
        cY = Math.map(mouseY, 0, renderer.domElement.height, -1, 1);
    }

    function mousedown(event) {
        renderer.setClearColor(0xfcfcfc, 1);
        renderer.clear();
    }

    var sketchFractalFlame = {
        id: "flame",
        init: init,
        animate: animate,
        mousemove: mousemove,
        mousedown: mousedown
    };
    initializeSketch(sketchFractalFlame);
})();

