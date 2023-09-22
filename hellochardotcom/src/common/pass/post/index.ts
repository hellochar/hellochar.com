import * as THREE from "three";

import { PostShader } from "./shader";

export class PostPass extends THREE.ShaderPass {
    constructor() {
        super(PostShader);
    }
}

export default PostPass;
