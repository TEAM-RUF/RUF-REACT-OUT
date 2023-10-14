import { SupportedModels } from "@tensorflow-models/pose-detection";

export const MULTIPLIER_BASED_ON_DEVICE_WIDTH =
  typeof window !== "undefined" ? window.outerWidth / 1920 : 0.666666;
export const MODIFIER = 1.1;
const BASE_VALUE = (1920 / 2) * MULTIPLIER_BASED_ON_DEVICE_WIDTH * MODIFIER;
export const VIDEO_WIDTH = Math.floor(BASE_VALUE);
export const VIDEO_HEIGHT = Math.floor(BASE_VALUE * 0.5625); // 16:9 aspect ratio

export const DEFAULT_LINE_WIDTH = 2;
export const DEFAULT_RADIUS = 4;

export const STATE = {
  camera: { targetFPS: 60, sizeOption: "640 X 480" },
  flags: {
    WEBGL_CPU_FORWARD: true,
    WEBGL_FLUSH_THRESHOLD: -1,
    WEBGL_FORCE_F16_TEXTURES: false,
    WEBGL_PACK: true,
    WEBGL_RENDER_FLOAT32_CAPABLE: true,
    WEBGL_VERSION: 2,
  },
  modelConfig: {
    maxPoses: 1,
    type: "lightning",
    scoreThreshold: 0.3,
    customModel: "",
    enableTracking: false,
    render3D: false,
  },
  model: "MoveNet" as SupportedModels,
  backend: "movenet",
};

export const flagsForTensorflow = {
  WEBGL_CPU_FORWARD: true,
  WEBGL_FLUSH_THRESHOLD: -1,
  WEBGL_FORCE_F16_TEXTURES: false,
  WEBGL_PACK: true,
  WEBGL_RENDER_FLOAT32_CAPABLE: true,
  WEBGL_VERSION: 2,
};
