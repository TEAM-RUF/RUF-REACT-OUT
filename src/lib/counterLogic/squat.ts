import { Keypoint } from "@tensorflow-models/pose-detection";

// const SQUAT_ANGLE_DOWN = 60; // ORIGINAL VALUE
// const SQUAT_ANGLE_UP = 150; // ORIGINAL VALUE

const ANGLE_DOWN_THRESHOLD = 100;
const ANGLE_UP_THRESHOLD = 140;
export function calculateAngleForSquat({
  ankleX,
  ankleY,
  hipX,
  hipY,
  kneeX,
  kneeY,
}: {
  hipX: number;
  hipY: number;
  kneeX: number;
  kneeY: number;
  ankleX: number;
  ankleY: number;
}) {

  const radians =
    Math.atan2(ankleX - kneeX, ankleY - kneeY) -
    Math.atan2(hipX - kneeX, hipY - kneeY);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  return angle;
}

export function judgePoseForSquat({ keypoints }: { keypoints: Keypoint[] }) {
  type KeypointsObjType = {
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

  const keypointsObj = keypoints.reduce((acc, cur) => {
    if (cur.score != null && cur.score > 0.5) {
      return Object.assign({ [cur.name!]: cur }, acc);
    } else {
      return acc;
    }
  }, {}) as KeypointsObjType;

  let userAngle;
  if (
    keypointsObj.right_hip &&
    keypointsObj.right_knee &&
    keypointsObj.right_ankle
  ) {
    userAngle = calculateAngleForSquat({
      hipX: keypointsObj.right_hip.x,
      hipY: keypointsObj.right_hip.y,
      kneeX: keypointsObj.right_knee.x,
      kneeY: keypointsObj.right_knee.y,
      ankleX: keypointsObj.right_ankle.x,
      ankleY: keypointsObj.right_ankle.y,
    });
  } else if (
    keypointsObj.left_hip &&
    keypointsObj.left_knee &&
    keypointsObj.left_ankle
  ) {
    userAngle = calculateAngleForSquat({
      hipX: keypointsObj.left_hip.x,
      hipY: keypointsObj.left_hip.y,
      kneeX: keypointsObj.left_knee.x,
      kneeY: keypointsObj.left_knee.y,
      ankleX: keypointsObj.left_ankle.x,
      ankleY: keypointsObj.left_ankle.y,
    });
  }

  // roen1024 아래 문단
  let kneeWarning = null;
  if (keypointsObj.right_knee && keypointsObj.right_ankle && keypointsObj.right_knee.x - keypointsObj.right_ankle.x > KNEE_THRESHOLD) {
    kneeWarning = "무릎!";
    console.log("무릎!");
  } else if (keypointsObj.left_knee && keypointsObj.left_ankle && keypointsObj.left_knee.x - keypointsObj.left_ankle.x > KNEE_THRESHOLD) {
    kneeWarning = "무릎!";
    console.log("무릎!");
  }
  
  const workoutState = localStorage.getItem("workoutState");
  if (workoutState === "DOWN" && userAngle && userAngle > ANGLE_UP_THRESHOLD) {
    return {
      isCounterUp: true,
      changedState: "UP",
    };
  } else if (
    workoutState === "UP" &&
    userAngle &&
    userAngle < ANGLE_DOWN_THRESHOLD
  ) {
    return {
      isCounterUp: false,
      changedState: "DOWN",
      warning: kneeWarning, // roen1024
      // 안녕!
    };
  } else {
    return {
      isCounterUp: false,
      changedState: null,
      warning: kneeWarning, // roen1024
    };
  }
}
