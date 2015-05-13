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
        Swirl: function(point) {
            var r2 = point.lengthSq();
            point.set(point.x * Math.sin(r2) - point.y * Math.cos(r2),
                      point.x * Math.cos(r2) + point.y * Math.sin(r2),
                      0);
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

    function stepAffine(affine, point, color) {
        // apply the affine transform to the point
        affine.transform(point);

        // apply the nonlinear variation to the point
        affine.variation(point);

        // interpolate towards the affine color
        // color.lerp(affine.color, 0.5);
        color.add(affine.color);
    }

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
        stepAffine(affine, point, color);
    }

    var SERPINSKI_TRIANGLE = new AffineSet([
        {
            color: new THREE.Color(0xff8888),
            weight: 1,
            transform: function(point) {
                point.set((cX + point.x) / 2, (cY+point.y) / 2, 0);
            },
            variation: VARIATIONS.Swirl
        },
        {
            color: new THREE.Color("green"),
            weight: 1,
            transform: function(point) {
                point.set( (-1 + point.x) / 2 + 0.25, (-1 + point.y) / 2, 0);
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

    function SuperPoint(point, color, rootGeometry) {
        this.point = point;
        this.color = color;
        this.rootGeometry = rootGeometry;
        rootGeometry.vertices.push(point);
        rootGeometry.colors.push(color);
    }

    SuperPoint.prototype.updateSubtree = function(affineSet, depth) {
        if (depth === 0) return;

        if (this.children == null) {
            this.children = affineSet.affines.map(function () {
                return new SuperPoint(new THREE.Vector3(), new THREE.Color(), this.rootGeometry);
            }.bind(this));
        }
        this.children.forEach(function (child, idx) {
            var affine = affineSet.affines[idx];
            // reset the child's position to your updated position so it's ready to get stepped
            child.point.copy(this.point);
            child.color.copy(this.color);
            stepAffine(affine, child.point, child.color);
            child.updateSubtree(affineSet, depth - 1);
        }.bind(this));
    }

    var scene, renderer, camera, geometry, pointCloud;

    var superPoint;

    function init(_renderer, _audioContext) {
        scene = new THREE.Scene();

        renderer = _renderer;

        var aspectRatio = renderer.domElement.height / renderer.domElement.width;
        // camera = new THREE.OrthographicCamera(-1.1, 1.1, -1.1*aspectRatio, 1.1*aspectRatio, 1, 1000);
        camera = new THREE.PerspectiveCamera(0.4, 1 / aspectRatio, 1, 1000);
        camera.position.z = 500;
        camera.lookAt(new THREE.Vector3());

        geometry = new THREE.Geometry();

        superPoint = new SuperPoint(new THREE.Vector3(0, 0, 0), new THREE.Color(), geometry);

        var material = new THREE.PointCloudMaterial({
            vertexColors: THREE.VertexColors,
            size: 2,
            sizeAttenuation: true
        });

        pointCloud = new THREE.PointCloud(geometry, material);
        scene.add(pointCloud);
    }

    function animate() {
        // superPoint.point.set(cX, cY, 0);
        superPoint.point.set(0,0,0);
        superPoint.updateSubtree(SERPINSKI_TRIANGLE, 9);
        // geometry.vertices.forEach(function (point, idx) {
        //     var color = geometry.colors[idx];
        //     color.setRGB(0,0,0);
        //     SERPINSKI_TRIANGLE.step(point, color);
        // });
        geometry.verticesNeedUpdate = true;
        renderer.render(scene, camera);
    }

    var cX = 0, cY = 0;
    function mousemove(event) {
        var mouseX = event.offsetX == undefined ? event.originalEvent.layerX : event.offsetX;
        var mouseY = event.offsetY == undefined ? event.originalEvent.layerY : event.offsetY;

        cX = Math.pow(Math.map(mouseX, 0, renderer.domElement.width, -4, 4), 3);
        cY = Math.pow(Math.map(mouseY, 0, renderer.domElement.height, 4, -4), 3);
    }

    function mousedown(event) {
    }

    function resize() {
        camera.aspect = renderer.domElement.width / camera.domElement.height;
        camera.updateProjectionMatrix();
    }

    var sketchFractalFlame = {
        id: "flame",
        init: init,
        animate: animate,
        mousemove: mousemove,
        mousedown: mousedown,
        resize: resize
    };
    window.registerSketch(sketchFractalFlame);
})();

