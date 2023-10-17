"use client";

import { Countdown } from "@/components/Countdown";
import { settingMovenetV2 } from "@/lib/movenet/movenetMainV2";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/SelectForDevice";
import { Camera } from "@/lib/movenet/camera";
import { Pose, PoseDetector } from "@tensorflow-models/pose-detection";
import { RendererCanvas2d } from "@/lib/movenet/renderer_canvas2d";
import { judgePoseForBenchpress } from "@/lib/counterLogic/benchPress";
import { useRouter, useSearchParams } from "next/navigation";
import { useAtom } from "jotai";
import {
  recordedVideoBlobArrAtom,
  workoutTimeArrAtom,
} from "@/lib/globalState/atom";
import { toast, useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import GuideVideo from "@/components/GuideVideo";
import { writeLoadingToCanvas } from "@/lib/utils";
import { judgePoseForDeadlift } from "@/lib/counterLogic/deadlift";
import { judgePoseForSquat } from "@/lib/counterLogic/squat";
import { WorkoutType } from "@/type/type";
import {
  MODIFIER,
  MULTIPLIER_BASED_ON_DEVICE_WIDTH,
} from "@/lib/movenet/params";
// SpeachSynthesisApi import
import { useSpeachSynthesisApi } from "./hooks/useSpeakSynthesisApi";

export function MovenetV2() {
  const [mediaDeviceArr, setMediaDeviceArr] = useState<MediaDeviceInfo[]>([]);
  const router = useRouter();
  const [, setRecordedVideoBlobArr] = useAtom(recordedVideoBlobArrAtom);
  const [, setWorkoutTimeArr] = useAtom(workoutTimeArrAtom);

  const [isSetChanged, setIsSetChanged] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const repCountRef = useRef<number>(repCount);
  repCountRef.current = repCount;

  const currentWorkoutSetRef = useRef<number>(1);
  const startTimeRef = useRef<number>(0);
  const [isCountdownFinished, setIsCountdownFinished] = useState(false);
  const isCountdownFinishedRef = useRef<boolean>(false);
  isCountdownFinishedRef.current = isCountdownFinished;

  const { workoutType, numberOfSet, numberOfRep, restInterval, isGuideVideo } =
    useParamsForWorkout();

  const numberOfRepOfThisSet = numberOfRep.at(
    currentWorkoutSetRef.current - 1
  )!;
  const numberOfRepOfThisSetRef = useRef<number>(numberOfRepOfThisSet);
  numberOfRepOfThisSetRef.current = numberOfRepOfThisSet;

  const remainingRepCount =
    numberOfRepOfThisSetRef.current - repCountRef.current;

  const {
    videoRef,
    guideVideoRef,
    detectorRef,
    cameraRef,
    statsRef,
    startInferenceTimeRef,
    numInferencesRef,
    inferenceTimeSumRef,
    lastPanelUpdateRef,
    rendererRef,
    customFpsPanelRef,
    rafIdRef,
    mediaStreamInstanceRef,
    canvasRef: outputCanvasRef,
    hasMovenetInitialized,
    videoStreamChunksRef,
    canvasForRotateRef,
  } = useRefsForMovenet();

  // Initialize useSpeachSynthesisApi 
  const {
    isSpeaking,
    isPaused,
    isResumed,
    isEnded,
    speak,
    pause,
    resume,
    cancel,
  } = useSpeachSynthesisApi();

  const hasLoaded = useRef<boolean>(false);
  useEffect(() => {
    if (!hasLoaded.current) {
      speak("운동을 시작해볼까요?");
      hasLoaded.current = true;
    }
  }, []);

  useEffect(() => {
    (async () => {
      const videoDevices = (
        await navigator.mediaDevices.enumerateDevices()
      ).filter((device) => device.kind === "videoinput");

      setMediaDeviceArr(videoDevices);
    })();
  });

  useLayoutEffect(() => {
    if (isSetChanged) {
      currentWorkoutSetRef.current += 1;
      setIsSetChanged(false);
    }
  }, [isSetChanged]);

  useEffect(() => {
    if (isCountdownFinished) {
      guideVideoRef.current?.play();
      startRecord();
    }
  }, [isCountdownFinished, guideVideoRef]);

  useLayoutEffect(() => {
    if (outputCanvasRef.current) {
      writeLoadingToCanvas(outputCanvasRef.current);
    }
  }, [outputCanvasRef]);

  const goToNextSet = () => {
    if (guideVideoRef.current) {
      guideVideoRef.current.pause();
      guideVideoRef.current.currentTime = 0;
    }

    stopRecord();

    if (currentWorkoutSetRef.current + 1 > numberOfSet) {
      const searchParams = new URLSearchParams({
        numberOfSet,
        workoutType,
        isDropout: "false",
        isGuideVideo: isGuideVideo.toString(),
      } as any).toString();

      router.push(`/workout_done?${searchParams}`);
    } else {
      setIsCountdownFinished(false);
      currentWorkoutSetRef.current += 1;
      setRepCount(1);
    }
  };

  const startRecord = () => {
    if (!videoRef.current) return;
    if (videoRef.current.srcObject == null) return;

    const mediaStreamInstance = new MediaRecorder(
      videoRef.current.srcObject as MediaStream
    );

    mediaStreamInstance.ondataavailable = (event) => {
      videoStreamChunksRef.current.push(event.data);
    };

    mediaStreamInstance.onstop = async () => {
      const blob = new Blob(videoStreamChunksRef.current);

      setRecordedVideoBlobArr((prev) => {
        const newArr = [...prev, blob];
        return newArr;
      });
      videoStreamChunksRef.current = [];
    };

    startTimeRef.current = performance.now();

    mediaStreamInstance.start();
    mediaStreamInstanceRef.current = mediaStreamInstance;
  };

  const stopRecord = () => {
    if (mediaStreamInstanceRef.current) {
      const workoutTimeSecond =
        (performance.now() - startTimeRef.current - 600) / 1000;

      setWorkoutTimeArr((prev) => {
        const prevClone = [...prev];
        prevClone.push(workoutTimeSecond);
        return prevClone;
      });

      mediaStreamInstanceRef.current.stop();
    } else {
      alert("[in stopRecord function] mediaStreamInstanceRef.current is null");
    }
  };

  useEffect(function initializeMovenet() {
    (async () => {
      if (hasMovenetInitialized.current) {
        return;
      }
      hasMovenetInitialized.current = true;
      const {
        detector,
        camera,
        stats,
        startInferenceTime,
        numInferences,
        inferenceTimeSum,
        lastPanelUpdate,
        renderer,
        customFpsPanel,
      } = await settingMovenetV2({
        workoutType,
        videoRef,
        outputCanvasRef: outputCanvasRef,
      });
      cameraRef.current = camera;
      detectorRef.current = detector;
      statsRef.current = stats;
      startInferenceTimeRef.current = startInferenceTime!;
      numInferencesRef.current = numInferences;
      inferenceTimeSumRef.current = inferenceTimeSum;
      lastPanelUpdateRef.current = lastPanelUpdate;
      rendererRef.current = renderer;
      customFpsPanelRef.current = customFpsPanel;

      if (workoutType === "bench_press" || workoutType === "deadlift") {
        localStorage.setItem("workoutState", "DOWN");
      } else if (workoutType === "squat") {
        localStorage.setItem("workoutState", "UP");
      }
      renderPrediction();
    })();

    async function renderPrediction() {
      if (isCountdownFinishedRef.current) {
        renderResult();
      }
      rafIdRef.current = requestAnimationFrame(renderPrediction);
    }

    async function renderResult() {
      if (videoRef.current && videoRef.current.readyState < 2) {
        await new Promise((resolve) => {
          videoRef.current!.onloadeddata = () => {
            resolve(null);
          };
        });
      }

      let poses: null | Pose[] = null;

      if (workoutType === "bench_press") {
        canvasForRotateRef.current!.width = videoRef.current!.videoWidth;
        canvasForRotateRef.current!.height = videoRef.current!.videoHeight;
      } else {
        canvasForRotateRef.current!.width = videoRef.current!.videoHeight;
        canvasForRotateRef.current!.height = videoRef.current!.videoWidth;
      }

      const ctx = canvasForRotateRef.current!.getContext("2d")!;

      if (detectorRef.current != null) {
        startInferenceTimeRef.current = beginEstimatePosesStats();

        if (workoutType === "bench_press") {
          ctx.translate(
            videoRef.current!.videoWidth,
            videoRef.current!.videoHeight
          );
          ctx.rotate(Math.PI);
        } else {
          // 90도 회전
          ctx.translate(videoRef.current!.videoHeight, 0);
          ctx.rotate(Math.PI / 2);
        }

        ctx.drawImage(videoRef.current!, 0, 0);

        poses = await detectorRef.current.estimatePoses(
          canvasForRotateRef.current!,
          { maxPoses: 1 }
        );

        if (poses && poses.at(0)) {
          const keypoints = poses.at(0)!.keypoints!;

          let isCounterUp: boolean | null = null;
          let changedState: string | null = null;

          if (workoutType === "bench_press") {
            const judgeResult = judgePoseForBenchpress({
              keypoints,
            });

            changedState = judgeResult.changedState;
            isCounterUp = judgeResult.isCounterUp;
          } else if (workoutType === "deadlift") {
            const judgeResult = judgePoseForDeadlift({
              keypoints,
            });

            changedState = judgeResult.changedState;
            isCounterUp = judgeResult.isCounterUp;
          } else if (workoutType === "squat") {
            const judgeResult = judgePoseForSquat({
              keypoints,
            });

            changedState = judgeResult.changedState;
            isCounterUp = judgeResult.isCounterUp;
          }

          if (changedState) {
            if (process.env.NODE_ENV === "development") {
              toast({
                title: changedState,
              });
            }
            localStorage.setItem("workoutState", changedState);

            if (isCounterUp) {
              if (repCountRef.current + 1 >= numberOfRepOfThisSetRef.current) {
                goToNextSet();
              } else {
                setRepCount((prevRepCount) => prevRepCount + 1);
              }
            }
          }
        }
        endEstimatePosesStats();
      }

      if (rendererRef.current) {
        rendererRef.current.draw(canvasForRotateRef.current!, poses);
      }
    }

    function beginEstimatePosesStats() {
      const startInferenceTime = performance.now();
      return startInferenceTime;
    }

    function endEstimatePosesStats() {
      const endInferenceTime = performance.now();
      inferenceTimeSumRef.current! +=
        endInferenceTime - startInferenceTimeRef.current!;
      numInferencesRef.current! += 1;

      const panelUpdateMilliseconds = 1000;
      if (
        endInferenceTime - lastPanelUpdateRef.current! >=
        panelUpdateMilliseconds
      ) {
        const averageInferenceTime =
          inferenceTimeSumRef.current! / numInferencesRef.current!;
        inferenceTimeSumRef.current = 0;
        numInferencesRef.current = 0;
        customFpsPanelRef.current!.update(
          1000.0 / averageInferenceTime,
          120 /* maxValue */
        );
        lastPanelUpdateRef.current = endInferenceTime;
      }
    }
    return () => cancelAnimationFrame(rafIdRef.current!);
  }, []);

  const changeCamera = async (deviceId: string) => {
    if (cameraRef.current) {
      cameraRef.current.changeCamera(deviceId);
    } else {
      console.log("CANNOT CHANGE CAMERA");
    }
  };

  const dropoutWorkout = () => {
    stopRecord();
    const searchParams = new URLSearchParams([
      ["numberOfSet", currentWorkoutSetRef.current!.toString()],
      ["workoutType", workoutType],
      ["isDropout", "true"],
      ["isGuideVideo", isGuideVideo.toString()],
    ]);
    router.push(`/workout_done?${searchParams.toString()}`);
  };

  return (
    <>
      <div className="w-screen h-screen flex justify-center bg-black">
        {!isCountdownFinished && (
          <Countdown
            countdownDuration={
              currentWorkoutSetRef.current === 1 ? 3 : restInterval
            }
            setIsCountdownFinished={setIsCountdownFinished}
          />
        )}
        <>
          <div
            className="w-[100%] h-[90%] bg-black  flex flex-col justify-center items-center"
            style={{
              display: isCountdownFinished ? "block" : "none",
            }}
          >
            {remainingRepCount <= 3 && (
              <div className="z-[1000] relative">
                <div
                  className="absolute border-4 border-[#6a66fa] text-[#6a66fa] bg-white text-center rounded-xl text-3xl font-bold px-6 py-2 w-[25%] left-0  "
                  style={{
                    top: `${73 * MODIFIER}dvh`,
                    left:
                      workoutType === "bench_press" && isGuideVideo
                        ? `${25 * MODIFIER}dvw`
                        : workoutType === "bench_press" && !isGuideVideo
                          ? "50dvw"
                          : isGuideVideo
                            ? "35dvw"
                            : "50dvw",
                    transform: "translateX(-50%)",
                    opacity: "0.7",
                  }}
                >
                  {`${remainingRepCount}개 남았어요!`}
                </div>
              </div>
            )}
            <canvas
              ref={canvasForRotateRef}
              style={{ display: "none" }}
            ></canvas>
            <div id="stats" style={{ display: "none" }}></div>
            <div id="scatter-gl-container"></div>
            <div
              className="w-full h-[100%] flex justify-center items-center px-0"
              style={{ flex: "1 1 100%" }}
            >
              <div
                className="w-full h-full flex justify-end items-center"
                style={{
                  justifyContent: isGuideVideo ? "end" : "center",
                  justifyItems: isGuideVideo ? "" : "center",
                }}
              >
                <div className="canvas-wrapper" style={{}}>
                  <div
                    className="relative w-[100%] z-[10]"
                    style={{
                      transform:
                        workoutType === "bench_press"
                          ? `translateY(-${200 * MULTIPLIER_BASED_ON_DEVICE_WIDTH
                          }px)`
                          : "",
                    }}
                  >
                    <div
                      className="absolute bg-[#6a66fa] text-white px-5 py-3 mt-6 rounded-3xl text-xl font-bold"
                      style={{
                        left: workoutType === "bench_press" ? "27%" : "5%",
                      }}
                    >
                      {`${currentWorkoutSetRef.current} / ${numberOfSet} 세트`}
                    </div>
                    <div
                      className="absolute bg-[#6a66fa] text-white px-5 py-3 mt-6 rounded-3xl text-xl font-bold"
                      style={{
                        right: workoutType === "bench_press" ? "27%" : "5%",
                      }}
                    >
                      {`${repCount} / ${numberOfRep.at(
                        currentWorkoutSetRef.current - 1
                      )} 회`}
                    </div>
                  </div>
                  <canvas
                    ref={outputCanvasRef}
                    id="output"
                    className="border-[3px] border-[#0acf83]"
                    style={{
                      transform:
                        workoutType === "bench_press" ? "rotate(90deg)" : "",
                    }}
                  ></canvas>
                  <video
                    id="video"
                    ref={videoRef}
                    playsInline
                    style={{
                      display: "none",
                    }}
                  ></video>
                </div>
              </div>
              {isGuideVideo && (
                <div className="w-full">
                  <GuideVideo
                    guideVideoRef={guideVideoRef}
                    workoutType={workoutType}
                  />
                </div>
              )}
            </div>
          </div>
          <div
            className="fixed bottom-0 flex w-full justify-between items-center px-10"
            style={{
              display: isCountdownFinished ? "" : "none",
              flex: "1 1 100%",
            }}
          >
            <div className="w-full" style={{}}>
              <Select onValueChange={changeCamera}>
                <SelectTrigger className="">
                  <SelectValue
                    placeholder={
                      mediaDeviceArr.length === 0
                        ? ""
                        : mediaDeviceArr.at(0)!.label
                    }
                    defaultValue={""}
                  />
                </SelectTrigger>
                <SelectContent>
                  {mediaDeviceArr.length === 0 ? (
                    <SelectItem value={"LOADING..."}>{"LOADING..."}</SelectItem>
                  ) : (
                    mediaDeviceArr.map((device, i) => {
                      if (device.deviceId === "") return null;
                      return (
                        <SelectItem key={i} value={device.deviceId}>
                          {device.label}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full"></div>
            <div className="w-full justify-end flex flex-1 gap-5 py-2">
              <button
                className="px-4 w-full text-xl font-bold py-2 rounded-lg bg-[#5c59ff] text-white cursor-pointer"
                onClick={() => goToNextSet()}
                style={{
                  width: "max-content",
                }}
              >
                다음 세트로 넘어가기
              </button>
              <button
                className="px-4 w-full text-xl font-bold py-2 rounded-lg bg-[#ff5959] text-white cursor-pointer"
                onClick={() => dropoutWorkout()}
                style={{
                  width: "max-content",
                }}
              >
                운동 끝내기
              </button>
            </div>
          </div>
        </>
      </div>
    </>
  );
}

function useRefsForMovenet() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const guideVideoRef = useRef<HTMLVideoElement>(null);
  const detectorRef = useRef<PoseDetector | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const statsRef = useRef<Stats | null>(null);
  const startInferenceTimeRef = useRef<number | null>(0);
  const numInferencesRef = useRef<number | null>(0);
  const inferenceTimeSumRef = useRef<number | null>(0);
  const lastPanelUpdateRef = useRef<number | null>(0);
  const rendererRef = useRef<RendererCanvas2d | null>(null);
  const customFpsPanelRef = useRef<Stats.Panel | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const mediaStreamInstanceRef = useRef<MediaRecorder | null>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hasMovenetInitialized = useRef<boolean>(false);
  const videoStreamChunksRef = useRef<BlobPart[]>([]);
  const canvasForRotateRef = useRef<HTMLCanvasElement | null>(null);

  return {
    videoRef,
    guideVideoRef,
    detectorRef,
    cameraRef,
    statsRef,
    startInferenceTimeRef,
    numInferencesRef,
    inferenceTimeSumRef,
    lastPanelUpdateRef,
    rendererRef,
    customFpsPanelRef,
    rafIdRef,
    mediaStreamInstanceRef,
    canvasRef: outputCanvasRef,
    hasMovenetInitialized,
    videoStreamChunksRef,
    canvasForRotateRef,
  };
}

function useParamsForWorkout() {
  const searchParams = useSearchParams();
  const workoutType = searchParams.get("workout_type")! as WorkoutType;
  const numberOfSet = parseInt(searchParams.get("numberOfSet")!);
  const numberOfRep = searchParams
    .get("numberOfRep")!
    .split(",")
    .map((item) => parseInt(item));
  const restInterval = parseInt(searchParams.get("restInterval")!);
  const isGuideVideo = JSON.parse(searchParams.get("isGuideVideo")!) as boolean;
  return {
    workoutType,
    numberOfSet,
    numberOfRep,
    restInterval,
    isGuideVideo,
  };
}
