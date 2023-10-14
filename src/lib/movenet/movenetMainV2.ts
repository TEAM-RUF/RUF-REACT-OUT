import * as tf from "@tensorflow/tfjs-core";
import * as posedetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import { Camera } from "./camera";
import { RendererCanvas2d } from "./renderer_canvas2d";
import { setupStats } from "./stats_panel";
import { WorkoutType } from "@/type/type";
import { flagsForTensorflow } from "./params";

export type CameraType = {
  targetFPS: number;
  sizeOption: string;
};

export async function settingMovenetV2({
  workoutType,
  videoRef,
  outputCanvasRef: outputCanvasRef,
}: {
  workoutType: WorkoutType;
  videoRef: React.RefObject<HTMLVideoElement>;
  outputCanvasRef: React.RefObject<HTMLCanvasElement>;
}) {
  let detector: posedetection.PoseDetector | undefined;
  let camera: Camera | undefined;
  let stats: Stats | undefined;
  let startInferenceTime: number | undefined;
  let numInferences = 0;
  let inferenceTimeSum = 0;
  let lastPanelUpdate = 0;
  let renderer: RendererCanvas2d | undefined;
  let customFpsPanel: Stats.Panel | undefined;

  const statsObj = setupStats();

  customFpsPanel = statsObj.customFpsPanel;
  stats = statsObj.stats;
  camera = await Camera.setup({ workoutType, videoRef });

  tf.env().setFlags(flagsForTensorflow);
  tf.setBackend("webgl");
  detector = await posedetection.createDetector(
    posedetection.SupportedModels.MoveNet,
    { modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
  );

  await tf.ready();

  const outputCanvas = outputCanvasRef.current!
  
  if (workoutType === "bench_press") {
    outputCanvas.width = camera.video.width;
    outputCanvas.height = camera.video.height;
  } else {
    outputCanvas.width = camera.video.height;
    outputCanvas.height = camera.video.width;
  }

  renderer = new RendererCanvas2d(outputCanvas);

  return {
    detector,
    camera,
    stats,
    startInferenceTime,
    numInferences,
    inferenceTimeSum,
    lastPanelUpdate,
    renderer,
    customFpsPanel,
  };
}
