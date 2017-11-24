import * as THREE from "three";

// HACK monkeypatch the old features that requires THREE on the global namespace
(window as any).THREE = THREE;
import "../old/threejs/controls/OrbitControls";
import "../old/threejs/postprocessing/EffectComposer";
import "../old/threejs/postprocessing/MaskPass";
import "../old/threejs/postprocessing/RenderPass";
import "../old/threejs/postprocessing/ShaderPass";
import "../old/threejs/shaders/CopyShader";
import "../old/threejs/shaders/DotScreenShader";
import "../old/threejs/stats.min";
