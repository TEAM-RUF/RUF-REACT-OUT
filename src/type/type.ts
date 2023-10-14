import { Keypoint } from "@tensorflow-models/pose-detection";

export type WorkoutType = "bench_press" | "squat" | "deadlift"

export type KeypointsObjType = {
    nose: Keypoint;
    left_eye: Keypoint;
    right_eye: Keypoint;
    left_ear: Keypoint;
    right_ear: Keypoint;
    left_shoulder: Keypoint;
    right_shoulder: Keypoint;
    left_elbow: Keypoint;
    right_elbow: Keypoint;
    left_wrist: Keypoint;
    right_wrist: Keypoint;
    left_hip: Keypoint;
    right_hip: Keypoint;
    left_knee: Keypoint;
    right_knee: Keypoint;
    left_ankle: Keypoint;
    right_ankle: Keypoint;
  };