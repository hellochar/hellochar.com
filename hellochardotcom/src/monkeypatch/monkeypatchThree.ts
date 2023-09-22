import * as THREE from "three";

// HACK monkeypatch the old features that requires THREE on the global namespace
(window as any).THREE = THREE;
// tslint:disable

import "three/examples/js/loaders/GLTFLoader";

import "three/examples/js/postprocessing/EffectComposer";

import "three/examples/js/controls/OrbitControls";
import "three/examples/js/controls/PointerLockControls";

import "three/examples/js/libs/stats.min";
// import * as dat from "three/examples/js/libs/dat.gui.min";
// (window as any).dat = dat;

import "three/examples/js/shaders/BokehShader";
// import "three/examples/js/shaders/BokehShader2";

import "three/examples/js/shaders/CopyShader";
import "three/examples/js/shaders/DotScreenShader";
// required by SAOShader
import "three/examples/js/shaders/DepthLimitedBlurShader";
import "three/examples/js/shaders/SAOShader";
import "three/examples/js/shaders/SSAOShader";
import "three/examples/js/shaders/LuminosityHighPassShader";
import "three/examples/js/shaders/LuminosityShader";
import "three/examples/js/shaders/ToneMapShader";
// required by SAOShader
import "three/examples/js/shaders/UnpackDepthRGBAShader";
import "three/examples/js/postprocessing/ShaderPass";
import "three/examples/js/postprocessing/RenderPass";
import "three/examples/js/postprocessing/BokehPass";
import "three/examples/js/postprocessing/MaskPass";
import "three/examples/js/postprocessing/SSAARenderPass";
import "three/examples/js/postprocessing/SAOPass";
import "three/examples/js/postprocessing/SSAOPass";
import "three/examples/js/postprocessing/UnrealBloomPass";
import "three/examples/js/postprocessing/AdaptiveToneMappingPass";

import "three/examples/js/objects/Sky";
