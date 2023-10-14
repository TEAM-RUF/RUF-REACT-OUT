import { KeypointsObjType } from "@/type/type";
import { Keypoint } from "@tensorflow-models/pose-detection";
import { getKeypointsObj } from "./util";

const ANGLE_DOWN_THRESHOLD = 85;
const ANGLE_UP_THRESHOLD = 130;

export function judgePoseForBenchpress({
  keypoints,
}: {
  keypoints: Keypoint[];
}) {  

  const keypointsObj = getKeypointsObj(keypoints)

  let userAngle;
  if (
    keypointsObj.right_shoulder &&
    keypointsObj.right_elbow &&
    keypointsObj.right_wrist
  ) {
    userAngle = calculateAngleForBenchPress({
      elbowX: keypointsObj.right_elbow.x,
      elbowY: keypointsObj.right_elbow.y,
      shoulderX: keypointsObj.right_shoulder.x,
      shoulderY: keypointsObj.right_shoulder.y,
      wristX: keypointsObj.right_wrist.x,
      wristY: keypointsObj.right_wrist.y,
    });
  } else if (
    keypointsObj.left_shoulder &&
    keypointsObj.left_elbow &&
    keypointsObj.left_wrist
  ) {
    userAngle = calculateAngleForBenchPress({
      elbowX: keypointsObj.left_elbow.x,
      elbowY: keypointsObj.left_elbow.y,
      shoulderX: keypointsObj.left_shoulder.x,
      shoulderY: keypointsObj.left_shoulder.y,
      wristX: keypointsObj.left_wrist.x,
      wristY: keypointsObj.left_wrist.y,
    });
  } else {
    return {
      isCounterUp: false,
      changedState: null,
    };
  }

  const workoutState = localStorage.getItem("workoutState");
  if (workoutState === "UP" && userAngle < ANGLE_DOWN_THRESHOLD) {
    return {
      isCounterUp: false,
      changedState: "DOWN",
    };
  } else if (workoutState === "DOWN" && userAngle > ANGLE_UP_THRESHOLD) {
    return {
      isCounterUp: true,
      changedState: "UP",
    };
  } else {
    return {
      isCounterUp: false,
      changedState: null,
    };
  }
}

function calculateAngleForBenchPress({
  shoulderX,
  shoulderY,
  elbowX,
  elbowY,
  wristX,
  wristY,
}: {
  shoulderX: number;
  shoulderY: number;
  elbowX: number;
  elbowY: number;
  wristX: number;
  wristY: number;
}): number {
  const radians =
    Math.atan2(wristY - elbowY, wristX - elbowX) -
    Math.atan2(shoulderY - elbowY, shoulderX - elbowX);
  const angle = Math.abs((radians * 180.0) / Math.PI);
  const modifiedAngle = angle > 180.0 ? 360 - angle : angle;
  return modifiedAngle;
}
