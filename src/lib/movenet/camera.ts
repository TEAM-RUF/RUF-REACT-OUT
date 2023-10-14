import { VIDEO_HEIGHT, VIDEO_WIDTH } from "@/lib/movenet/params";

export class Camera {
  video;

  constructor(videoElement: HTMLVideoElement) {
    this.video = videoElement;
  }

  async changeCamera(deviceId: string) {
    const videoConfig = {
      audio: false,
      video: {
        width: { ideal: VIDEO_WIDTH },
        height: { ideal: VIDEO_HEIGHT },
        deviceId,
      },
    };

    const stream = await navigator.mediaDevices.getUserMedia(videoConfig);
    this.video.srcObject = stream;

    await new Promise((resolve) => {
      this.video.onloadedmetadata = () => {
        resolve("");
      };
    });
    this.video.play();
  }

  static async setup({
    workoutType,
    videoRef,
  }: {
    workoutType: "bench_press" | "squat" | "deadlift";
    videoRef: React.RefObject<HTMLVideoElement>;
  }) {
    const videoDevices = (
      await navigator.mediaDevices.enumerateDevices()
    ).filter((device) => device.kind === "videoinput");

    const videoConfig = {
      audio: false,
      video: {
        width: { ideal: VIDEO_WIDTH },
        height: { ideal: VIDEO_HEIGHT },
        deviceId: videoDevices.at(0)!.deviceId,
      },
    };

    const stream = await navigator.mediaDevices.getUserMedia(videoConfig);
    const videoElement = videoRef.current!;
    const camera = new Camera(videoElement);
    camera.video.srcObject = stream;

    await new Promise((resolve) => {
      camera.video.onloadedmetadata = () => {
        resolve(videoElement);
      };
    });

    camera.video.play();

    const videoWidth = camera.video.videoWidth;
    const videoHeight = camera.video.videoHeight;

    // Must set below two lines, otherwise video element doesn't show.
    camera.video.width = videoWidth;
    camera.video.height = videoHeight;

    const canvasContainer = document.querySelector(
      ".canvas-wrapper"
    ) as HTMLDivElement;

    if (workoutType === "bench_press") {
      canvasContainer.style.width = `${videoWidth}px`;
      canvasContainer.style.height = `${videoHeight}px`;
    } else {
      canvasContainer.style.width = `${videoHeight}px`;
      canvasContainer.style.height = `${videoWidth}px`;
    }
    return camera;
  }
}
