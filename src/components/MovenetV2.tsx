"use client";

import { VIDEO_HEIGHT, VIDEO_WIDTH } from "@/lib/movenet/params";
import axios from "axios";
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
import { atom, useAtom } from "jotai";
import {
  recordedVideoBlobArrAtom,
  workoutTimeArrAtom,
  fileNameArrayAtom,
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
  const [incorrectState, setIncorrectState] = useState<"SQUAT_KNEE" | "">("");
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
  let curVideoBlobArr = useRef<Blob>(new Blob());
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
    video1Ref,
    video2Ref,
    guideVideoRef,
    detectorRef,
    camera1Ref,
    camera2Ref,
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

  const incorrectSpeakState = useRef<boolean>(false);
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

      const secondDevice = videoDevices.at(1);
      if (secondDevice) {
        changeCamera({ deviceId: secondDevice.deviceId, videoRef: video2Ref });
      }
    })();
  }, []);

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

    // // Next Step으로 넘어가기 전에 Blob 정보 저장
    // const blob = new Blob(videoStreamChunksRef.current);
    // curVideoBlobArr.current = blob;
    // console.log("goToNextSet Blob Size " + blob);
    // console.log("goToNextSet Blob Size " + curVideoBlobArr.current.size);

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
      setRepCount(0);
    }
  };

  //랜덤토큰 생성로직
  function generateRandomString(length: number): string {
    const charset =
      "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      result += charset[randomIndex];
    }
    return result;
  }

  // jotai atom으로 fileName State 관리
  const [fileNameArray, setFileNameArray] = useAtom(fileNameArrayAtom);

  const startRecord = () => {
    if (!video1Ref.current) return;
    if (video1Ref.current.srcObject == null) return;

    const mediaStreamInstance = new MediaRecorder(
      video1Ref.current.srcObject as MediaStream
    );

    mediaStreamInstance.ondataavailable = (event) => {
      videoStreamChunksRef.current.push(event.data);
    };

    // onStop시 blob을 통해 videoStreamChunksRef 저장
    mediaStreamInstance.onstop = async () => {
      const blob = new Blob(videoStreamChunksRef.current);
      curVideoBlobArr.current = blob;
      console.log("onStop Blob Size " + blob);
      console.log("onStop Blob Size " + curVideoBlobArr.current.size);

      setRecordedVideoBlobArr((prev) => {
        const newArr = [...prev, blob];
        return newArr;
      });
      videoStreamChunksRef.current = [];

      // setRecordedVideoBlobArr에 저장한 이후에 서버로 전송하는 작업 수행
      const videoName =
        generateRandomString(10) +
        "_" +
        workoutType +
        "_" +
        currentWorkoutSetRef.current +
        ".mp4";


      // videoName을 전역 State에 저장
      setFileNameArray((prev) => {
        const newArr = [...prev, videoName];
        return newArr;
      });

      const newVideoFile = new File([blob], videoName, { type: "video/mp4" });

      //form-data body
      const formData = new FormData();
      formData.append("file", newVideoFile);
      formData.append("workout", workoutType);
      formData.append("set", currentWorkoutSetRef.current.toString());
      formData.append("userToken", "TEST_TOKEN");
      const transport = axios.create({ withCredentials: true });

      transport
        .post(
          process.env.NEXT_PUBLIC_BACKEND_HOST + "/video/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            timeout: 0,
          }
        )
        .then((res) => {
          console.log(res.data);
        })
        .catch((error) => {
          console.log(error);
        });
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
        videoRef: video1Ref,
        outputCanvasRef: outputCanvasRef,
      });
      camera1Ref.current = camera;
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
      if (video1Ref.current && video1Ref.current.readyState < 2) {
        await new Promise((resolve) => {
          video1Ref.current!.onloadeddata = () => {
            resolve(null);
          };
        });
      }

      let poses: null | Pose[] = null;

      if (workoutType === "bench_press") {
        canvasForRotateRef.current!.width = video1Ref.current!.videoWidth;
        canvasForRotateRef.current!.height = video1Ref.current!.videoHeight;
      } else {
        canvasForRotateRef.current!.width = video1Ref.current!.videoHeight;
        canvasForRotateRef.current!.height = video1Ref.current!.videoWidth;
      }

      const ctx = canvasForRotateRef.current!.getContext("2d")!;

      if (detectorRef.current != null) {
        startInferenceTimeRef.current = beginEstimatePosesStats();

        if (workoutType === "bench_press") {
          ctx.translate(
            video1Ref.current!.videoWidth,
            video1Ref.current!.videoHeight
          );
          ctx.rotate(Math.PI);
        } else {
          // 90도 회전
          ctx.translate(video1Ref.current!.videoHeight, 0);
          ctx.rotate(Math.PI / 2);
        }

        ctx.drawImage(video1Ref.current!, 0, 0);

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

            // incorrectSpeakState로 무릎을 여러번
            if (
              judgeResult.incorrectState &&
              incorrectSpeakState.current == false
            ) {
              setIncorrectState(judgeResult.incorrectState);
              speak("무릎"); // 무릎 주의 메세지 출력
              incorrectSpeakState.current = true;

              setTimeout(() => {
                setIncorrectState("");
                incorrectSpeakState.current = false;
              }, 1000);
            }
          }

          if (changedState) {
            if (process.env.NODE_ENV === "development") {
              toast({
                title: changedState,
              });
            }
            localStorage.setItem("workoutState", changedState);

            if (isCounterUp) {
              let repCountCur = repCountRef.current;
              let numRepSetCur = numberOfRepOfThisSetRef.current;

              console.log(repCountCur + " " + numRepSetCur);
              if (
                repCountCur + 1 >= numRepSetCur - 3 &&
                repCountCur + 1 < numRepSetCur
              ) {
                speak(numRepSetCur - (repCountCur + 1) + "개 남았어요!");
              } else {
                speak(repCountRef.current + 1 + "개");
              }

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

  const changeCamera1st = async (deviceId: string) => {
    console.log(deviceId);

    if (camera1Ref.current) {
      camera1Ref.current.changeCamera(deviceId);
    } else {
      console.log("CANNOT CHANGE CAMERA");
    }
  };

  const changeCamera2nd = async (deviceId: string) => {
    console.log(deviceId);

    changeCamera({ deviceId, videoRef: video2Ref });

    // if (camera2Ref.current) {
    //   changeCamera({deviceId ,videoRef : video2Ref})
    //   // camera2Ref.current.changeCamera(deviceId);
    // } else {
    //   console.log("CANNOT CHANGE CAMERA");
    // }
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
            currentWorkoutSet={currentWorkoutSetRef.current}
            recordedVideoBlob={curVideoBlobArr.current}
            workoutType={workoutType}
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
            {incorrectState.length > 0 && (
              <div className="z-[1000] relative">
                <div
                  className={
                    "absolute border-4 border-[#fa6666] text-[#fa6666] bg-white text-center rounded-xl text-3xl font-bold px-6 py-2 w-[25%] left-0"
                  }
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
                  {incorrectState === "SQUAT_KNEE" ? "무릎 주의 !" : ""}
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
              className="relative  w-full h-[100%]  px-0"
              style={{ flex: "1 1 100%" }}
            >
              <div
                className="fixed left-0 top-[20%]   flex justify-end items-center"
                style={{
                  justifyContent: isGuideVideo ? "end" : "center",
                  justifyItems: isGuideVideo ? "" : "center",
                }}
              >
                <div className="canvas-wrapper" style={{}}>
                  {/* <div
                    className="relative w-[100%] z-[10]"
                    style={{
                      transform:
                        workoutType === "bench_press"
                          ? `translateY(-${
                              200 * MULTIPLIER_BASED_ON_DEVICE_WIDTH
                            }px)`
                          : "",
                    }}
                  >
                    <div
                      className="absolute bg-black text-[#cff947] border-2 border-[#cff947] px-5 py-3 mt-6 rounded-3xl text-xl font-bold"
                      style={{
                        left: workoutType === "bench_press" ? "27%" : "5%",
                      }}
                    >
                      {`${currentWorkoutSetRef.current} / ${numberOfSet} 세트`}
                    </div>
                    <div
                      className="absolute bg-[#cff947] text-black px-5 py-3 mt-6 rounded-3xl text-xl font-bold"
                      style={{
                        right: workoutType === "bench_press" ? "27%" : "5%",
                      }}
                    >
                      {`${repCount} / ${numberOfRep.at(
                        currentWorkoutSetRef.current - 1
                      )} 회`}
                    </div>
                  </div> */}
                  <canvas
                    ref={outputCanvasRef}
                    id="output"
                    className="border-[3px] border-[#cff947]"
                    style={{
                      transform:
                        workoutType === "bench_press" ? "rotate(90deg)" : "",
                    }}
                  ></canvas>
                  <video
                    id="video"
                    ref={video1Ref}
                    playsInline
                    style={{
                      display: "none",
                    }}
                  ></video>
                </div>
              </div>

              <div
                className="absolute left-[50%] -translate-x-[50%] w-[fit-content]  z-[10] flex flex-col"
                style={{
                  transform: "",
                }}
              >
                <div
                  className="text-center bg-black text-[#cff947] border-2 border-[#cff947] px-5 py-3 mt-6 rounded-3xl text-xl font-bold"
                  style={{
                    left: workoutType === "bench_press" ? "27%" : "5%",
                  }}
                >
                  {`${currentWorkoutSetRef.current} / ${numberOfSet} 세트`}
                </div>
                <div
                  className="text-center bg-[#cff947] text-black px-5 py-3 mt-6 rounded-3xl text-xl font-bold"
                  style={{
                    right: workoutType === "bench_press" ? "27%" : "5%",
                  }}
                >
                  {`${repCount} / ${numberOfRep.at(
                    currentWorkoutSetRef.current - 1
                  )} 회`}
                </div>
              </div>

              <div
                className="fixed  right-0 top-[20%]  flex justify-end items-center "
                style={{
                  justifyContent: isGuideVideo ? "end" : "center",
                  justifyItems: isGuideVideo ? "" : "center",
                }}
              >
                <div className="canvas-wrapper" style={{}}>
                  {/* <div
                    className="relative w-[100%] z-[10]"
                    style={{
                      transform:
                        workoutType === "bench_press"
                          ? `translateY(-${
                              200 * MULTIPLIER_BASED_ON_DEVICE_WIDTH
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
                  </div> */}
                  {/* <canvas
                    ref={outputCanvasRef}
                    id="output"
                    className="border-[3px] border-[#0acf83]"
                    style={{
                      transform:
                        workoutType === "bench_press" ? "rotate(90deg)" : "",
                    }}
                  ></canvas> */}
                  <video
                    id="video2"
                    ref={video2Ref}
                    className="border-[3px] border-[#cff947]"
                    playsInline
                    style={{
                      transform: "rotate(90deg)",
                      // display: "none",
                    }}
                  ></video>
                </div>
              </div>
              {/* {isGuideVideo && (
                <div className="w-full">
                  <GuideVideo
                    guideVideoRef={guideVideoRef}
                    workoutType={workoutType}
                  />
                </div>
              )} */}
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
              <Select onValueChange={changeCamera1st}>
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
            <div className="w-full" style={{}}>
              <Select onValueChange={changeCamera2nd}>
                <SelectTrigger className="">
                  <SelectValue
                    placeholder={
                      mediaDeviceArr.length === 0
                        ? ""
                        : mediaDeviceArr.at(1)!.label
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
                className="px-4 w-full text-xl font-bold py-2 rounded-lg bg-[#383838] text-[#d9d9d9] cursor-pointer"
                onClick={() => goToNextSet()}
                style={{
                  width: "max-content",
                }}
              >
                다음 세트로 넘어가기
              </button>
              <button
                className="px-4 w-full text-xl font-bold py-2 rounded-lg bg-[#cff947] text-black cursor-pointer"
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
  const video1Ref = useRef<HTMLVideoElement>(null!);
  const video2Ref = useRef<HTMLVideoElement>(null!);
  const guideVideoRef = useRef<HTMLVideoElement>(null);
  const detectorRef = useRef<PoseDetector | null>(null);
  const camera1Ref = useRef<Camera | null>(null);
  const camera2Ref = useRef<Camera | null>(null);
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
    video1Ref,
    video2Ref,
    guideVideoRef,
    detectorRef,
    camera1Ref,
    camera2Ref,
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

async function changeCamera({
  deviceId,
  videoRef,
}: {
  deviceId: string;
  videoRef: React.MutableRefObject<HTMLVideoElement>;
}) {
  const videoConfig = {
    audio: false,
    video: {
      width: { ideal: VIDEO_WIDTH },
      height: { ideal: VIDEO_HEIGHT },
      deviceId,
    },
  };

  const stream = await navigator.mediaDevices.getUserMedia(videoConfig);
  // videoRef.curren

  videoRef.current.srcObject = stream;
  // this.video.srcObject = stream;

  await new Promise((resolve) => {
    videoRef.current.onloadedmetadata = () => {
      resolve("");
    };
  });
  videoRef.current.play();
}
