import * as THREE from "three";

// HACK monkeypatch the old features that requires THREE on the global namespace
(window as any).THREE = THREE;
import "../public/threejs/controls/OrbitControls";
import "../public/threejs/postprocessing/EffectComposer";
import "../public/threejs/postprocessing/MaskPass";
import "../public/threejs/postprocessing/RenderPass";
import "../public/threejs/postprocessing/ShaderPass";
import "../public/threejs/shaders/DotScreenShader";
import "../public/threejs/shaders/CopyShader";
import "../public/threejs/stats.min";
