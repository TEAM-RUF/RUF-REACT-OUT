import { Keypoint } from "@tensorflow-models/pose-detection";

// const SQUAT_ANGLE_DOWN = 60; // ORIGINAL VALUE
// const SQUAT_ANGLE_UP = 150; // ORIGINAL VALUE

const ANGLE_DOWN_THRESHOLD = 100;
const ANGLE_UP_THRESHOLD = 140;
const INCORRENT_KNEE_GRADIENT_THRESHOLD = 1.5;

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

type KeypointProps = { keypoints: Keypoint[] };

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

export function judgePoseForSquat({ keypoints }: KeypointProps) {
  const keypointsObj = keypoints.reduce((acc, cur) => {
    if (cur.score != null && cur.score > 0.5) {
      return Object.assign({ [cur.name!]: cur }, acc);
    } else {
      return acc;
    }
  }, {}) as KeypointsObjType;

  const isIncorrectKnee = judgeIsIncorrectKnee({ keypointsObj });

  if (isIncorrectKnee) {
    return {
      isCounterUp: false,
      changedState: null,
      incorrectState: "SQUAT_KNEE" as const,
    };
  }

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
    };
  } else {
    return {
      isCounterUp: false,
      changedState: null,
    };
  }
}

function judgeIsIncorrectKnee({
  keypointsObj: { left_knee, right_knee, left_ankle, right_ankle },
}: {
  keypointsObj: KeypointsObjType;
}) {
  let deltaY: number | undefined;
  let deltaX: number | undefined;

  if (left_knee && left_ankle) {
    deltaY = left_ankle.y - left_knee.y;
    deltaX = left_ankle.x - left_knee.x;
  } else if (right_knee && right_ankle) {
    deltaY = right_ankle.y - right_knee.y;
    deltaX = right_ankle.x - right_knee.x;
  }

  if (typeof deltaY === "number" && typeof deltaX === "number") {
    const computed_knee_gradient = Math.abs(deltaY / deltaX);
    if (INCORRENT_KNEE_GRADIENT_THRESHOLD > computed_knee_gradient) {
      console.log("INCORRECT POSE");
      return true;
    } else return false;
  } else return false;
}
