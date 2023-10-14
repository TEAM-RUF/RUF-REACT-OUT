import { KeypointsObjType } from "@/type/type";
import { Keypoint } from "@tensorflow-models/pose-detection";

export const getKeypointsObj = (keypoints: Keypoint[]) =>
  keypoints.reduce((acc, cur) => {
    if (cur.score != null && cur.score > 0.5) {
      return Object.assign({ [cur.name!]: cur }, acc);
    } else {
      return acc;
    }
  }, {}) as KeypointsObjType;
