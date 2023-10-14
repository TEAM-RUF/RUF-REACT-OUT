import { Keypoint } from "@tensorflow-models/pose-detection";

// const DEADLIFT_ANGLE_DOWN = 90; // ORIGINAL VALUE
// const DEADLIFT_ANGLE_UP = 160; // ORIGINAL VALUE

const ANGLE_DOWN_THRESHOLD = 110;
const ANGLE_UP_THRESHOLD = 160;

export function calculateAngleForDeadlift({
  shoulderX,
  shoulderY,
  hipX,
  hipY,
  kneeX,
  kneeY,
}: {
  hipX: number;
  hipY: number;
  kneeX: number;
  kneeY: number;
  shoulderX: number;
  shoulderY: number;
}) {
  const radians =
    Math.atan2(kneeX - hipX, kneeY - hipY) -
    Math.atan2(shoulderX - hipX, shoulderY - hipY);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  return angle;
}

export function judgePoseForDeadlift({ keypoints }: { keypoints: Keypoint[] }) {
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
    keypointsObj.right_shoulder &&
    keypointsObj.right_hip &&
    keypointsObj.right_knee
  ) {
    userAngle = calculateAngleForDeadlift({
      shoulderX: keypointsObj.right_shoulder.x,
      shoulderY: keypointsObj.right_shoulder.y,
      hipX: keypointsObj.right_hip.x,
      hipY: keypointsObj.right_hip.y,
      kneeX: keypointsObj.right_knee.x,
      kneeY: keypointsObj.right_knee.y,
    });
  } else if (
    keypointsObj.left_shoulder &&
    keypointsObj.left_hip &&
    keypointsObj.left_knee
  ) {
    userAngle = calculateAngleForDeadlift({
      shoulderX: keypointsObj.left_shoulder.x,
      shoulderY: keypointsObj.left_shoulder.y,
      hipX: keypointsObj.left_hip.x,
      hipY: keypointsObj.left_hip.y,
      kneeX: keypointsObj.left_knee.x,
      kneeY: keypointsObj.left_knee.y,
    });
  }

  const workoutState = localStorage.getItem("workoutState");
  if (workoutState === "DOWN" && userAngle && userAngle > ANGLE_UP_THRESHOLD) {
    return {
      isCounterUp: true,
      changedState: "UP",
    };
  } else if (workoutState === "UP" && userAngle && userAngle < ANGLE_DOWN_THRESHOLD) {
    return {
      isCounterUp: false,
      changedState: "DOWN",
    };
  } else {
    return {
      isCounterUp: false,
      changedState: null,
    };
  }
}
