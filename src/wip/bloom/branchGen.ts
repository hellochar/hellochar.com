
        // const branchLength = 5;
        // const numSegments = 25;
        // const geometry = new THREE.CylinderGeometry(
        //     0.1,
        //     0.1,
        //     branchLength,
        //     8,
        //     numSegments,
        //     true,
        // );
        // geometry.translate(0, branchLength / 2, 0);
        // for (const vertex of geometry.vertices) {
        //     const boneIndex = Math.floor(map(vertex.y, 0, branchLength, 0, numSegments));
        //     geometry.skinIndices.push(new THREE.Vector4(boneIndex, 0, 0, 0) as any);
        //     geometry.skinWeights.push(new THREE.Vector4(1, 0, 0, 0) as any);
        // }
        // this creates 48 vertices:
        // y = 0, x8
        // y = 1, x8
        // y = 2, x8
        // y = 3, x8
        // y = 4, x8
        // y = 5, x8
        // we could control this with 5 bones:
        // bone 0, at y = 0
        // bone 1, at y = 1
        // bone 2, at y = 2
        // bone 3, at y = 3
        // bone 4, at y = 4 (note - end of bone 4 controls the y=5 ring)
        // each of these bones is connected to the previous one (that is, .add()-ed),
        // so changes to the first bone propogate to all the rest
        // that's what gives it that magic property.
        // what is each vertex's final position decided by?

        // const bones: THREE.Bone[] = [];
        // for (let y = 0; y <= numSegments; y++) {
        //     const bone = new THREE.Bone(null as any);
        //     if (y > 0) {
        //         const prevBone = bones[y - 1];
        //         prevBone.add(bone);
        //         bone.position.y = branchLength / numSegments;
        //     }
        //     bones.push(bone);
        // }

        // const mat = new THREE.MeshBasicMaterial({skinning: true, color: "green", side: THREE.DoubleSide});
        // const mesh = new THREE.SkinnedMesh(geometry, mat);
        // mesh.add(bones[0]);
        // this.skeleton = new THREE.Skeleton(bones);
        // mesh.bind(this.skeleton);
        // mesh.rotateZ(-Math.PI / 2);
        // // for (const bone of bones) {
        // //     bone.rotateY(-0.2);
        // // }
        // this.scene.add(mesh);
        // console.log(this.skeleton);
        // const helper = new THREE.SkeletonHelper(bones[0]);
        // this.scene.add(helper);
