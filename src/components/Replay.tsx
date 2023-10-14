"use client";

import Logo from "../../public/logo.png";
import {
  MODIFIER,
  MULTIPLIER_BASED_ON_DEVICE_WIDTH,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "@/lib/movenet/params";
import Image from "next/image";
import { Play, Pause } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/SelectForReplay";
import { useAtom } from "jotai";
import {
  recordedVideoBlobArrAtom,
  workoutTimeArrAtom,
} from "@/lib/globalState/atom";
import { use, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import GuideVideo from "@/components/GuideVideo";

export function ReplayImpl() {
  const searchParams = useSearchParams();
  const workoutType = searchParams.get("workoutType")!;
  const numberOfSet = parseInt(searchParams.get("numberOfSet")!);
  const isDropout = JSON.parse(searchParams.get("isDropout")!) as boolean;
  const isGuideVideo = JSON.parse(searchParams.get("isGuideVideo")!) as boolean;
  const router = useRouter();
  const [workoutTimeArr] = useAtom(workoutTimeArrAtom);
  const [recordedVideoBlobArr, setRecordedVideoBlobArr] = useAtom(
    recordedVideoBlobArrAtom
  );
  const [playState, setplayState] = useState<"PAUSE" | "PLAY">("PAUSE");
  const [seekValue, setSeekValue] = useState(0);
  const [isError, setIsError] = useState(false);
  const [recordedVideoURL, setRecordedVideoURL] = useState<string | null>(null);
  const [currentSetIdx, setcurrentSetIdx] = useState<number>(0);
  const currentWorkoutSeconds = workoutTimeArr[currentSetIdx];
  const guideVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const seekBarContainerRef = useRef<HTMLDivElement | null>(null);
  const seekBarRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(
    function initializeForPlay() {
      if (videoRef.current && playState === "PAUSE") {
        switchPlayState();
        onPlay();
      } else {
        console.log("자동재생 실패");
      }
    },
    [recordedVideoURL]
  );

  useEffect(function initializeEventListener() {
    const video = videoRef.current;
    const seekBarContainer = seekBarContainerRef.current;
    const seekBar = seekBarRef.current;

    const updateSeekBar = () => {
      if (video) {
        const percentage = (video.currentTime / currentWorkoutSeconds) * 100;
        if (seekBar) {
          seekBar.style.width = percentage + "%";
        }
      }
    };

    const seekVideo = (e: MouseEvent) => {
      if (video && seekBarContainer) {
        const offsetX =
          e.clientX - seekBarContainer.getBoundingClientRect().left;
        const percentage = offsetX / seekBarContainer.offsetWidth;
        video.currentTime = percentage * currentWorkoutSeconds;
      }
    };

    if (video) {
      video.addEventListener("timeupdate", updateSeekBar);
    }

    if (seekBarContainer) {
      seekBarContainer.addEventListener("click", seekVideo);
    }

    return () => {
      if (video) {
        video.removeEventListener("timeupdate", updateSeekBar);
      }
      if (seekBarContainer) {
        seekBarContainer.removeEventListener("click", seekVideo);
      }
    };
  }, []);

  useEffect(() => {
    if (recordedVideoBlobArr) {
      const blob = recordedVideoBlobArr.at(0);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setRecordedVideoURL(url);
      } else {
        setIsError(true);
      }
    }
  }, []);

  const seekVideo = (e: number[]) => {
    if (videoRef.current && !isFinite(currentWorkoutSeconds)) return;
    const percentage = e.at(0)!;
    const targetTime = (percentage / 100) * currentWorkoutSeconds;

    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }

    if (isGuideVideo && guideVideoRef.current) {
      guideVideoRef.current.currentTime = targetTime;
    }

    setSeekValue(percentage);
    if (playState === "PLAY") {
      videoRef.current?.play();
    }
  };

  const onPlay = () => {
    guideVideoRef.current?.play();
    videoRef.current?.play();
    play();
  };

  const onPause = () => {
    cancelAnimationFrame(rafIdRef.current!);
    guideVideoRef.current?.pause();
    videoRef.current?.pause();
  };

  const play = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;

      const duration = currentWorkoutSeconds;
      const percentage = (currentTime / duration) * 100;

      setSeekValue(percentage);
    }
    rafIdRef.current = requestAnimationFrame(play);
  };

  const changeVideoSpeed = (e: React.MouseEvent<HTMLButtonElement>) => {
    const speed = e.currentTarget.dataset.speed!;
    const targetSpeed = parseFloat(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = targetSpeed;
    }
    if (isGuideVideo && guideVideoRef.current) {
      guideVideoRef.current.playbackRate = targetSpeed;
    }
  };

  const changeVideo = (value: string) => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    const workoutSetIndex = parseInt(value) - 1;

    setcurrentSetIdx(workoutSetIndex);

    const blob = recordedVideoBlobArr.at(workoutSetIndex);
    if (blob) {
      const url = URL.createObjectURL(blob);
      setRecordedVideoURL(url);
      setplayState("PAUSE");
      setSeekValue(0);
      guideVideoRef.current?.pause();
      videoRef.current?.pause();
      setTimeout(() => {
        setplayState((prev) => {
          guideVideoRef.current?.play();
          videoRef.current?.play();
          return "PLAY";
        });
      }, 100);
    } else {
      setIsError(true);
    }
  };

  const handleMetadataLoaded = () => {
    if (guideVideoRef.current && videoRef.current) {
      guideVideoRef.current.currentTime = videoRef.current.currentTime = 0;
    }
  };

  const switchPlayState = () => {
    setplayState(playState === "PLAY" ? "PAUSE" : "PLAY");

    if (playState === "PLAY" && guideVideoRef.current && videoRef.current) {
      guideVideoRef.current.pause();
      videoRef.current.pause();
    } else if (
      playState === "PAUSE" &&
      guideVideoRef.current &&
      videoRef.current
    ) {
      guideVideoRef.current.play();
      videoRef.current.play();
    }
  };

  return (
    <>
      <div className="z-[10000] bg-transparent fixed w-full bg-black flex flex-1 items-center">
        <div className="w-full">
          <Image src={Logo} alt="로고" width={100} />
        </div>
        <div className="w-full flex justify-center">
          <div
            className={`w-[50%] flex flex-col items-center justify-center ${
              MULTIPLIER_BASED_ON_DEVICE_WIDTH === 1 ? "gap-2" : ""
            }`}
          >
            <div
              className="font-bold text-white"
              style={{
                fontSize: "1.3vw",
              }}
            >
              SET
            </div>
            <div
              className="w-full z-[10000]"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Select onValueChange={changeVideo}>
                <SelectTrigger className=" bg-[#0acf83] text-white font-bold">
                  <SelectValue placeholder="1" defaultValue={"1"} />
                </SelectTrigger>
                <SelectContent>
                  {Array(numberOfSet)
                    .fill(null)
                    .map((_, i) => {
                      const set = i + 1;
                      return (
                        <SelectItem
                          key={set}
                          value={set.toString()}
                        >{`${set}`}</SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="w-full"></div>
      </div>
      <div className="w-screen h-screen flex flex-col justify-center items-center bg-black text-white gap-8">
        <div
          className="w-full"
          style={{
            boxSizing: "border-box",
          }}
        >
          {!recordedVideoURL || isError ? (
            <div className="text-center flex flex-col gap-10 text-9xl font-bold">
              <div className="">오류가 발생했습니다</div>
              <div className="">
                {isError
                  ? "Blob Not Found"
                  : !recordedVideoURL
                  ? "recordedVideoURL"
                  : "UNKNOWN ISSUE"}
              </div>
            </div>
          ) : (
            <div className="z-[100] relative flex justify-center">
              <div className="w-full  flex justify-center items-center">
                <video
                  onClick={switchPlayState}
                  onLoadedMetadata={handleMetadataLoaded}
                  ref={videoRef}
                  style={{
                    transform: `scaleX(-1) rotate(90deg) ${
                      "translateX(-12px)"
                    }`,
                  }}
                  className="border-[3px] border-[#0acf83]"
                  src={recordedVideoURL}
                  controls={false}                  
                  width={isGuideVideo ? VIDEO_WIDTH : VIDEO_WIDTH / MODIFIER}
                ></video>
              </div>
              {isGuideVideo && (
                <div className="w-full relative flex justify-center">
                  <div className="w-[100%] absolute flex justify-center pt-5 pb-5 text-white text-4xl font-bold">
                    Guide
                  </div>
                  <div className="" onClick={switchPlayState}>
                    <GuideVideo
                      guideVideoRef={guideVideoRef}
                      workoutType={workoutType}
                      isReplay
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="fixed bottom-[10px] w-full flex flex-1 justify-center gap-10 bg-black text-white">
        <div className="w-full flex justify-end items-center gap-10 text-2xl">
          {playState === "PAUSE" ? (
            <Play
              onClick={() => {
                onPlay();
                setplayState("PLAY");
              }}
              className="cursor-pointer"
              size={48}
            />
          ) : (
            <Pause
              onClick={() => {
                onPause();
                setplayState("PAUSE");
              }}
              className="cursor-pointer"
              size={48}
            />
          )}
        </div>
        <div className="w-full flex flex-col justify-center gap-6">
          <div className="">
            <Slider
              defaultValue={[0]}
              value={[seekValue]}
              max={100}
              step={0.01}
              onValueChange={seekVideo}
            />
          </div>
          <div className="flex gap-6 justify-center">
            {[0.5, 1, 1.5].map((speed) => {
              return (
                <button
                  key={speed}
                  data-speed={speed}
                  className={`bg-white text-black px-6 font-bold rounded-xl hover:bg-violet-400 ${
                    MULTIPLIER_BASED_ON_DEVICE_WIDTH === 1 ? "py-2" : ""
                  }`}
                  style={{
                    fontSize: "1.2vw",
                  }}
                  onClick={changeVideoSpeed}
                >
                  {speed}배속
                </button>
              );
            })}
          </div>
        </div>
        <div className="w-full flex gap-6 items-center justify-end pr-10">
          <div className="">
            <button
              className="bg-[#FF0000] py-4 px-6 font-bold rounded-xl hover:bg-violet-400"
              style={{
                fontSize: "1.2vw",
              }}
              onClick={() => router.push("/")}
            >
              운동 끝내기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
