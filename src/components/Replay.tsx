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
  fileNameArrayAtom,
} from "@/lib/globalState/atom";
import { use, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import GuideVideo from "@/components/GuideVideo";
import QRCode from "qrcode-generator";

export function ReplayImpl() {
  const searchParams = useSearchParams();
  const workoutType = searchParams.get("workoutType")!;
  const numberOfSet = parseInt(searchParams.get("numberOfSet")!);
  const isDropout = JSON.parse(searchParams.get("isDropout")!) as boolean;
  const isGuideVideo = JSON.parse(searchParams.get("isGuideVideo")!) as boolean;
  const router = useRouter();
  const [workoutTimeArr] = useAtom(workoutTimeArrAtom);
  const [recordedVideoBlobObj, setRecordedVideoBlobArr] = useAtom(
    recordedVideoBlobArrAtom
  );

  

  const [fileNameArray, setFileNameArray] = useAtom(fileNameArrayAtom);
  const [playState, setplayState] = useState<"PAUSE" | "PLAY">("PAUSE");
  const [seekValue, setSeekValue] = useState(0);
  const [isError, setIsError] = useState(false);
  const [recordedVideoURL, setRecordedVideoURL] = useState<{
    left: string | null;
    right: string | null;
  }>({ left: null, right: null });
  const [currentSetIdx, setcurrentSetIdx] = useState<number>(0);
  const currentWorkoutSeconds = workoutTimeArr[currentSetIdx];
  // const videoElementRightRef = useRef<HTMLVideoElement>(null);
  const videoElementLeftRef = useRef<HTMLVideoElement | null>(null);
  const videoElementRightRef = useRef<HTMLVideoElement | null>(null);
  const seekBarContainerRef = useRef<HTMLDivElement | null>(null);
  const seekBarRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(
    function initializeForPlay() {
      if (videoElementLeftRef.current && playState === "PAUSE") {
        switchPlayState();
        onPlay();
      } else {
        console.log("자동재생 실패");
      }
    },
    [recordedVideoURL]
  );

  useEffect(function initializeEventListener() {
    generateQRCode(fileNameArray[0]);
    const videoElementLeft = videoElementLeftRef.current;
    const seekBarContainer = seekBarContainerRef.current;
    const seekBar = seekBarRef.current;

    const updateSeekBar = () => {
      if (videoElementLeft) {
        const percentage = (videoElementLeft.currentTime / currentWorkoutSeconds) * 100;
        if (seekBar) {
          seekBar.style.width = percentage + "%";
        }
      }
    };

    const seekVideo = (e : MouseEvent) => {
      if (videoElementLeft && seekBarContainer) {
        const offsetX =
          e.clientX - seekBarContainer.getBoundingClientRect().left;
        const percentage = offsetX / seekBarContainer.offsetWidth;
        videoElementLeft.currentTime = percentage * currentWorkoutSeconds;
      }
    };

    if (videoElementLeft) {
      videoElementLeft.addEventListener("timeupdate", updateSeekBar);
    }

    if (seekBarContainer) {
      seekBarContainer.addEventListener("click", seekVideo);
    }

    return () => {
      if (videoElementLeft) {
        videoElementLeft.removeEventListener("timeupdate", updateSeekBar);
      }
      if (seekBarContainer) {
        seekBarContainer.removeEventListener("click", seekVideo);
      }
    };
  }, []);

  useEffect(() => {
    if (recordedVideoBlobObj) {
      const leftBlob = recordedVideoBlobObj.left.at(0);
      const rightBlob = recordedVideoBlobObj.right.at(0);
      

      if (leftBlob && rightBlob) {
        const leftUrl = URL.createObjectURL(leftBlob);
        const rightUrl = URL.createObjectURL(rightBlob);
        setRecordedVideoURL({ left: leftUrl, right: rightUrl });
      } else {
        // console.log("에러 : leftBlob 또는 rightBlob가 없음 ");
        // console.log({ leftBlob });
        // console.log({ rightBlob });

        setIsError(true);
      }
    }
  }, []);

  const seekVideo = (e: number[]) => {
    if (videoElementLeftRef.current && !isFinite(currentWorkoutSeconds)) return;
    const percentage = e.at(0)!;
    const targetTime = (percentage / 100) * currentWorkoutSeconds;

    // if (videoElementLeftRef.current) {
    //   videoElementLeftRef.current.currentTime = targetTime;
    // }

    if (videoElementLeftRef.current ){
      videoElementLeftRef.current.currentTime = targetTime;

    }
    if ( videoElementRightRef.current) {
      videoElementRightRef.current.currentTime = targetTime;
    }

    setSeekValue(percentage);
    if (playState === "PLAY") {
      videoElementLeftRef.current?.play();
      videoElementRightRef.current?.play();
    }
  };

  const onPlay = () => {
    videoElementRightRef.current?.play();
    videoElementLeftRef.current?.play();
    play();
  };

  const onPause = () => {
    cancelAnimationFrame(rafIdRef.current!);
    videoElementRightRef.current?.pause();
    videoElementLeftRef.current?.pause();
  };

  const play = () => {
    if (videoElementLeftRef.current) {
      const currentTime = videoElementLeftRef.current.currentTime;

      const duration = currentWorkoutSeconds;
      const percentage = (currentTime / duration) * 100;

      setSeekValue(percentage);
    }
    rafIdRef.current = requestAnimationFrame(play);
  };

  const changeVideoSpeed = (e: React.MouseEvent<HTMLButtonElement>) => {
    const speed = e.currentTarget.dataset.speed!;
    const targetSpeed = parseFloat(speed);
    if (videoElementLeftRef.current) {
      videoElementLeftRef.current.playbackRate = targetSpeed;
    }
    // if (isGuideVideo && videoElementRightRef.current) {
    if (videoElementRightRef.current) {
      videoElementRightRef.current.playbackRate = targetSpeed;
    }
  };

  const changeVideo = (value: string) => {
    console.log('run changeVideo');
    
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    const workoutSetIndex = parseInt(value) - 1;

    // Video를 Chane할 때 해당 index로 filenameArray에서 filename 불러옴
    // console.log(fileNameArray[workoutSetIndex]);
    // generateQRCode(fileNameArray[workoutSetIndex]);
    //

    setcurrentSetIdx(workoutSetIndex);

    const leftBlob = recordedVideoBlobObj.left.at(workoutSetIndex);
    const rightBlob = recordedVideoBlobObj.right.at(workoutSetIndex);

    
    
    if (leftBlob && rightBlob) {

      // console.log("leftBlob.size");
      // console.log(leftBlob.size);
      // console.log("rightBlob.size");
      // console.log(rightBlob.size);
      
      // const url = URL.createObjectURL(leftBlob);
      setRecordedVideoURL(prev => ({
        // ...prev,
        left: URL.createObjectURL(leftBlob),
        right: URL.createObjectURL(rightBlob),
      }));
      setplayState("PAUSE");
      setSeekValue(0);
      // videoElementRightRef.current!.currentTime = 0;
      // videoElementLeftRef.current!.currentTime = 0;

      videoElementRightRef.current?.pause();
      videoElementLeftRef.current?.pause();
      setTimeout(() => {
        setplayState((prev) => {

          console.log('before seekVideo');
          
          seekVideo([0])
      //           videoElementRightRef.current!.currentTime = 0;
      // videoElementLeftRef.current!.currentTime = 0;
      //     videoElementRightRef.current?.play();
      //     videoElementLeftRef.current?.play();
          return "PLAY";
        });
      }, 1000);
    } else {
      setIsError(true);
    }
  };

  const handleMetadataLoaded = () => {
    if(videoElementRightRef.current) {
      videoElementRightRef.current.currentTime =0

    }
    if (videoElementLeftRef.current) {
        videoElementLeftRef.current.currentTime = 0;
    }
  };

  const switchPlayState = () => {
    setplayState(playState === "PLAY" ? "PAUSE" : "PLAY");

    if (
      playState === "PLAY" 
      
    ) {
      videoElementRightRef.current?.pause();
      videoElementLeftRef.current?.pause();
    } else if (
      playState === "PAUSE" 
    ) {
      videoElementRightRef.current?.play();
      videoElementLeftRef.current?.play();
    }
  };

  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  const generateQRCode = (filename: string) => {
    const url =
      process.env.NEXT_PUBLIC_BACKEND_HOST + "/video?filename=" + filename;

    if (qrCodeRef.current) {
      try {
        const qr = QRCode(0, "L"); // QR 코드 생성
        qr.addData(url);
        qr.make();

        // QR 코드 크기 설정
        const size = 200; // 원하는 크기로 조정 (예: 200px)

        // Canvas에 QR 코드 그리기
        const canvas = qrCodeRef.current;
        canvas.width = size; // Canvas의 폭 설정
        canvas.height = size; // Canvas의 높이 설정
        const context = canvas.getContext("2d");
        if (context) {
          const moduleCount = qr.getModuleCount();
          const cellSize = size / moduleCount;

          for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
              context.fillStyle = qr.isDark(row, col) ? "black" : "white";
              context.fillRect(
                col * cellSize,
                row * cellSize,
                cellSize,
                cellSize
              );
            }
          }
        }
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    }
  };

  return (
    <>
      <div className="z-[10000] bg-transparent fixed w-full bg-black flex flex-1 items-center">
        {/* <canvas
          ref={qrCodeRef}
          id="qr-code"
          style={{
            position: "absolute",
            top: "50px",
            left: "10px",
          }}
        /> */}

        <div className="w-full">
          <Image src={Logo} alt="로고" width={100} />
          <br />
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
              Set
            </div>
            <div
              className="w-full z-[10000]"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Select onValueChange={changeVideo}>
                <SelectTrigger className=" bg-[#cff947] text-black font-bold">
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
          {!recordedVideoURL.right || !recordedVideoURL.left || isError ? (
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
            <>
              <div className="flex gap-12">
                <div className="z-[100] relative flex justify-center">
                  <div className="w-full  flex justify-center items-center">
                    <video
                      onClick={switchPlayState}
                      onLoadedMetadata={handleMetadataLoaded}
                      ref={videoElementLeftRef}
                      style={{
                        transform: `scaleX(-1) rotate(90deg) ${"translateX(-12px)"}`,
                      }}
                      className="border-[3px] border-[#cff947]"
                      src={recordedVideoURL.left}
                      controls={false}
                      width={VIDEO_WIDTH / MODIFIER}
                    ></video>
                  </div>
                </div>
                <div className="z-[100] relative flex justify-center">
                  <div className="w-full  flex justify-center items-center">
                    <video
                      onClick={switchPlayState}
                      onLoadedMetadata={handleMetadataLoaded}
                      ref={videoElementRightRef}
                      style={{
                        transform: `scaleX(-1) rotate(90deg) ${"translateX(-12px)"}`,
                      }}
                      className="border-[3px] border-[#cff947]"
                      src={recordedVideoURL.right}
                      controls={false}
                      width={VIDEO_WIDTH / MODIFIER}
                    ></video>
                  </div>
                </div>
              </div>
            </>
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
                  className={`bg-[#cff947] text-black px-6 font-bold rounded-xl hover:bg-violet-400 ${
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
              className="bg-[#5c59ff] py-4 px-6 font-bold rounded-xl hover:bg-violet-400"
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
