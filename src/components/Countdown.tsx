"use client";

import { FaMinus } from "react-icons/fa";
import { FaPlus } from "react-icons/fa6";
import { WorkoutType } from "@/type/type";
import { Ref, use, useEffect, useRef, useState } from "react";
import {
  CountdownCircleTimer,
  useCountdown,
} from "react-countdown-circle-timer";
import GuideVideo from "@/components/GuideVideo";
import {
  MODIFIER,
  MULTIPLIER_BASED_ON_DEVICE_WIDTH,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "@/lib/movenet/params";

export function Countdown({
  countdownDuration,
  currentWorkoutSet,
  recordedVideoBlob,
  workoutType,
  setIsCountdownFinished,
}: {
  countdownDuration: number;
  currentWorkoutSet: number;
  recordedVideoBlob: { left: Blob; right: Blob };
  workoutType: WorkoutType;
  setIsCountdownFinished: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null!);
  const [recordedVideoURL, setRecordedVideoURL] = useState<string | undefined>(
    undefined
  );
  let firstload = false;

  const [keyForCountdown, setKeyForCountdown] = useState(0); // 타이머의 key 값
  const [initialTime, setInitialTime] = useState(countdownDuration);

  const [remainingTime, setremainingTime] = useState(countdownDuration);

  const [currentPlayedBlob, setcurrentPlayedBlob] = useState<"LEFT" | "RIGHT">(
    "LEFT"
  );

  const remainingTimeRef = useRef(0);
  remainingTimeRef.current = remainingTime;

  useEffect(() => {
    (async () => {
      if (recordedVideoBlob && videoRef.current && !firstload) {
        // Check that videoRef.current is not null
        firstload = true;
        console.log("Countdown currentWorkoutSet " + currentWorkoutSet);
        console.log("Countdown Blob Size " + recordedVideoBlob.left.size);
        const blobUrl = URL.createObjectURL(recordedVideoBlob.left);
        console.log("Countdown blobUrl " + blobUrl);

        // videoRef.current.src = blobUrl;
        setRecordedVideoURL(blobUrl);

        // Add an event listener to know when the video is loaded
        videoRef.current.addEventListener("loadeddata", async () => {
          try {
            // Now that the video is loaded, you can safely play it
            await videoRef.current?.play(); // Add a null check here as well
          } catch (error) {
            console.error("Error playing the video:", error);
          }
        });
      }
    })();
  }, [recordedVideoBlob]);

  const changeRemainingTime = (variant: number) => {
    console.log("remainingTimeRef.current");
    console.log(remainingTimeRef.current);

    const targetTime = remainingTimeRef.current + variant;
    const targetTimeFixed =
      targetTime > countdownDuration
        ? countdownDuration
        : targetTime <= 1
        ? 1
        : targetTime;
    setInitialTime(targetTimeFixed);
    setKeyForCountdown((prevKey) => prevKey + 1); // key 값을 증가시켜 타이머 리셋
  };

  const changeCamera = () => {
    if(recordedVideoBlob) {

      setcurrentPlayedBlob((prev) => (prev === "LEFT" ? "RIGHT" : "LEFT"));

        const blobUrl = currentPlayedBlob === "LEFT" ? URL.createObjectURL(recordedVideoBlob.right)
         :  URL.createObjectURL(recordedVideoBlob.left)
        
        ;
        console.log("Countdown blobUrl " + blobUrl);
    
        // videoRef.current.src = blobUrl;
        setRecordedVideoURL(blobUrl);
    
        // Add an event listener to know when the video is loaded
        videoRef.current.addEventListener("loadeddata", async () => {
          try {
            // Now that the video is loaded, you can safely play it
            await videoRef.current?.play(); // Add a null check here as well
          } catch (error) {
            console.error("Error playing the video:", error);
          }
        });
    
     
    }
  };

  return (
    <div className="bg-black w-screen h-screen flex relative">
      {/* Left Half */}

      <div
        className={`${
          currentWorkoutSet === 1
            ? "w-full h-full flex items-center justify-center"
            : "w-1/2 h-full relative flex flex-col items-center justify-center gap-24"
        }`}
      >
        {currentWorkoutSet !== 1 && (
          <div className="text-white font-bold text-3xl">
            잠시 휴식을 취하세요!
          </div>
        )}

        <div className="text-4xl text-white font-bold flex items-center gap-12 ">
          {currentWorkoutSet !== 1 && (
            <div
              className="  bg-[#383838] z-[10000] h-[fit-content] py-4 px-8 rounded-full"
              onClick={() => changeRemainingTime(-5)}
            >
              <div className="flex gap-4 items-center">
                <div className="text-[#cff947] font-bold ">
                  {/* {`-`} */}
                  <FaMinus />
                </div>
                <div className="text-white font-bold">{`5`}</div>
              </div>
            </div>
          )}

          <CountdownCircleTimer
            isPlaying
            duration={countdownDuration}
            initialRemainingTime={initialTime}
            key={keyForCountdown}
            size={currentWorkoutSet === 1 ? 280 : 180}
            trailColor="#383838"
            colors={["#cff947", "#cff947", "#FF0000", "#FF0000"]}
            onUpdate={(remainingTime) => {
              setremainingTime(remainingTime);
            }}
            colorsTime={[10, 4, 3, 0]}
            onComplete={() => {
              setIsCountdownFinished(true);
            }}
          >
            {({ remainingTime }) =>
              currentWorkoutSet === 1 ? (
                <div className="text-9xl">{remainingTime}</div>
              ) : (
                <div className="text-7xl">{remainingTime}</div>
              )
            }
          </CountdownCircleTimer>

          {currentWorkoutSet !== 1 && (
            <div
              className="text-4xl  bg-[#383838] z-[10000] h-[fit-content] py-4 px-8 rounded-full"
              onClick={() => changeRemainingTime(5)}
            >
              <div className="flex gap-4 items-center">
                <div className="text-[#cff947] font-bold ">
                  {/* {`-`} */}
                  <FaPlus />
                </div>
                <div className="text-white font-bold">{`5`}</div>
              </div>
            </div>
          )}
        </div>

        {currentWorkoutSet !== 1 && (
          <div
            className="w-[80%] mt-[15%]"
            onClick={() => changeRemainingTime(-99)}
          >
            <button className="w-full text-xl font-bold py-4 rounded-lg bg-[#cff947] text-black cursor-pointer">
              건너뛰기
            </button>
          </div>
        )}
      </div>

      {/* Right Half (Video) */}
      {currentWorkoutSet !== 1 && (
        <div className={"w-1/2 h-full relative flex flex-col"}>
          <video
            ref={videoRef}
            className="border-[3px] border-[#cff947] absolute top-1/4 left-0 right-0 mx-auto"
            src={recordedVideoURL}
            controls={false}
            loop // Enable video looping
            style={{
              transform: `scaleX(-1) rotate(90deg) ${"translateX(-12px)"}`,
            }}
            width={VIDEO_WIDTH / MODIFIER}
          ></video>
          <div
            className="absolute bottom-[2%] right-[5%] bg-[#383838] text-white py-4 px-16 font-bold rounded-xl"
            onClick={changeCamera}
          >
            카메라 전환
          </div>
        </div>
      )}
    </div>
  );
}
