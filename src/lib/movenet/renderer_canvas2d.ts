import * as posedetection from "@tensorflow-models/pose-detection";
import { SupportedModels } from "@tensorflow-models/pose-detection";
import * as scatter from "scatter-gl";
import * as params from "./params";

const COLOR_PALETTE = [
  "#ffffff", // #ffffff - White
  "#800000", // #800000 - Maroon
  "#469990", // #469990 - Malachite
  "#e6194b", // #e6194b - Crimson
  "#42d4f4", // #42d4f4 - Picton Blue
  "#fabed4", // #fabed4 - Cupid
  "#aaffc3", // #aaffc3 - Mint Green
  "#9a6324", // #9a6324 - Kumera
  "#000075", // #000075 - Navy Blue
  "#f58231", // #f58231 - Jaffa
  "#4363d8", // #4363d8 - Royal Blue
  "#ffd8b1", // #ffd8b1 - Caramel
  "#dcbeff", // #dcbeff - Mauve
  "#808000", // #808000 - Olive
  "#ffe119", // #ffe119 - Candlelight
  "#911eb4", // #911eb4 - Seance
  "#bfef45", // #bfef45 - Inchworm
  "#f032e6", // #f032e6 - Razzle Dazzle Rose
  "#3cb44b", // #3cb44b - Chateau Green
  "#a9a9a9", // #a9a9a9 - Silver Chalice
];

const ANCHOR_POINTS: scatter.Point3D[] = [
  [0, 0, 0],
  [0, 1, 0],
  [-1, 0, 0],
  [-1, -1, 0],
];
export class RendererCanvas2d {
  videoWidth: number;
  videoHeight: number;
  ctx: CanvasRenderingContext2D;
  scatterGLEl: HTMLDivElement;
  scatterGL: scatter.ScatterGL;
  scatterGLHasInitialized: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.scatterGLEl = document.querySelector("#scatter-gl-container")!;
    this.scatterGL = new scatter.ScatterGL(this.scatterGLEl, {
      rotateOnStart: true,
      selectEnabled: false,
      styles: { polyline: { defaultOpacity: 1, deselectedOpacity: 1 } },
    });
    this.scatterGLHasInitialized = false;
    this.videoWidth = canvas.width;
    this.videoHeight = canvas.height;
    this.flip(this.videoWidth, this.videoHeight);
  }

  flip(videoWidth: number, videoHeight: number) {
    // Because the image from camera is mirrored, need to flip horizontally.
    this.ctx.translate(videoWidth, 0);
    this.ctx.scale(-1, 1);

    this.scatterGLEl.style.width = `${videoWidth}px`;
    this.scatterGLEl.style.height = `${videoHeight}px`;
    this.scatterGL.resize();
    this.scatterGLEl.style.display = "none";
  }

  draw(canvas: HTMLCanvasElement, poses: posedetection.Pose[] | null) {
    this.drawCtx(canvas);

    // The null check makes sure the UI is not in the middle of changing to a
    // different model. If during model change, the result is from an old model,
    // which shouldn't be rendered.
    
    // if (process.env.NODE_ENV === "development" && poses && poses.length > 0) {
    if ( poses && poses.length > 0) {
      this.drawResults(poses);
    }
  }

  drawCtx(canvas: HTMLCanvasElement) {
    this.ctx.drawImage(canvas, 0, 0, this.videoWidth, this.videoHeight);
  }

  clearCtx() {
    this.ctx.clearRect(0, 0, this.videoWidth, this.videoHeight);
  }

  drawResults(poses: posedetection.Pose[]) {
    for (const pose of poses) {
      this.drawResult(pose);
    }
  }

  drawResult(pose: posedetection.Pose) {
    if (pose.keypoints != null) {
      this.drawKeypoints(pose.keypoints);
      this.drawSkeleton(pose.keypoints, pose.id!);
    }
  }

  /**
   * Draw the keypoints on the video.
   * @param keypoints A list of keypoints.
   */
  drawKeypoints(keypoints: posedetection.Keypoint[]) {
    const keypointInd = posedetection.util.getKeypointIndexBySide(
      params.STATE.model as posedetection.SupportedModels
    );
    // this.ctx.fillStyle = "Red";
    // this.ctx.strokeStyle = "White";
    this.ctx.fillStyle = "#cff947"
    this.ctx.strokeStyle = "#cff947"
    
    this.ctx.lineWidth = params.DEFAULT_LINE_WIDTH;

    for (const i of keypointInd.middle) {
      this.drawKeypoint(keypoints[i]);
    }

    // this.ctx.fillStyle = "Green";
    this.ctx.fillStyle = "#cff947"
    for (const i of keypointInd.left) {
      this.drawKeypoint(keypoints[i]);
    }

    // this.ctx.fillStyle = "Orange";
    this.ctx.fillStyle = "#cff947"
    for (const i of keypointInd.right) {
      this.drawKeypoint(keypoints[i]);
    }
  }

  drawKeypoint(keypoint: posedetection.Keypoint) {
    // If score is null, just show the keypoint.
    const score = keypoint.score != null ? keypoint.score : 1;
    const scoreThreshold = params.STATE.modelConfig.scoreThreshold || 0;

    if (score >= scoreThreshold) {
      const circle = new Path2D();
      circle.arc(keypoint.x, keypoint.y, params.DEFAULT_RADIUS, 0, 2 * Math.PI);
      this.ctx.fill(circle);
      this.ctx.stroke(circle);
    }
  }

  /**
   * Draw the skeleton of a body on the video.
   * @param keypoints A list of keypoints.
   */
  drawSkeleton(keypoints: posedetection.Keypoint[], poseId: number) {
    // Each poseId is mapped to a color in the color palette.
    const color =
      params.STATE.modelConfig.enableTracking && poseId != null
        ? COLOR_PALETTE[poseId % 20]
        // : "White";
        : "#cff947" ; 
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = params.DEFAULT_LINE_WIDTH;

    posedetection.util
      .getAdjacentPairs(params.STATE.model as SupportedModels)
      .forEach(([i, j]) => {
        const keypoint1 = keypoints[i];
        const keypoint2 = keypoints[j];

        // If score is null, just show the keypoint.
        const score1 = keypoint1.score != null ? keypoint1.score : 1;
        const score2 = keypoint2.score != null ? keypoint2.score : 1;
        const scoreThreshold = params.STATE.modelConfig.scoreThreshold || 0;

        if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
          this.ctx.beginPath();
          this.ctx.moveTo(keypoint1.x, keypoint1.y);
          this.ctx.lineTo(keypoint2.x, keypoint2.y);
          this.ctx.stroke();
        }
      });
  }

  drawKeypoints3D(keypoints: posedetection.Keypoint[]) {
    const scoreThreshold = params.STATE.modelConfig.scoreThreshold || 0;
    const pointsData = keypoints.map(
      (keypoint) =>
        [
          -keypoint.x,
          -keypoint.y,
          0, // -keypoint.z,
        ] as scatter.Point3D
    );

    const scatterPoints: scatter.Points = [...pointsData, ...ANCHOR_POINTS];

    const dataset = new scatter.ScatterGL.Dataset(scatterPoints);

    const keypointInd = posedetection.util.getKeypointIndexBySide(
      params.STATE.model
    );
    this.scatterGL.setPointColorer((i) => {
      if (keypoints[i] == null || keypoints[i].score! < scoreThreshold) {
        // hide anchor points and low-confident points.
        // return "#ffffff";
        return "#cff947"
      }
      if (i === 0) {
        // return "#ff0000" /* Red */;
        return "#cff947"
      }
      if (keypointInd.left.indexOf(i) > -1) {
        // return "#00ff00" /* Green */;
        return "#cff947"

      }
      if (keypointInd.right.indexOf(i) > -1) {
        // return "#ffa500" /* Orange */;
        return "#cff947"

      }
      // return "#ffa500";
      return "#cff947"

    });

    if (!this.scatterGLHasInitialized) {
      this.scatterGL.render(dataset);
    } else {
      this.scatterGL.updateDataset(dataset);
    }
    const connections = posedetection.util.getAdjacentPairs(params.STATE.model);
    const sequences = connections.map((pair) => ({ indices: pair }));
    this.scatterGL.setSequences(sequences);
    this.scatterGLHasInitialized = true;
  }
}
