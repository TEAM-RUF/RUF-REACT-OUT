"use client";

import { WorkoutType } from "@/type/type";
import { Ref, use, useEffect, useRef, useState } from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
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
  recordedVideoBlob: Blob;
  workoutType: WorkoutType;
  setIsCountdownFinished: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [recordedVideoURL, setRecordedVideoURL] = useState<string | undefined>(undefined);
  let firstload = false;

  useEffect(() => {
    (async () => {
      if (recordedVideoBlob && videoRef.current && !firstload) { // Check that videoRef.current is not null
        firstload = true;
        console.log("Countdown currentWorkoutSet " + currentWorkoutSet);
        console.log("Countdown Blob Size " + recordedVideoBlob.size);
        const blobUrl = URL.createObjectURL(recordedVideoBlob);
        console.log("Countdown blobUrl " + blobUrl);

        // videoRef.current.src = blobUrl;
        setRecordedVideoURL(blobUrl);

        // Add an event listener to know when the video is loaded
        videoRef.current.addEventListener('loadeddata', async () => {
          try {
            // Now that the video is loaded, you can safely play it
            await videoRef.current?.play(); // Add a null check here as well
          } catch (error) {
            console.error('Error playing the video:', error);
          }
        });
      }
    })();
  }, [recordedVideoBlob]);

  return (
    <div className="bg-black w-screen h-screen flex relative">
      {/* Left Half */}
      <div className={`${currentWorkoutSet === 1 ? 'w-full h-full flex items-center justify-center' : 'w-1/2 h-full relative flex items-center justify-center '}`}>
        <div className="text-9xl text-white font-bold">
          <CountdownCircleTimer
            isPlaying
            duration={countdownDuration}
            size={280}
            colors={["#cff947", "#cff947", "#FF0000", "#FF0000"]}
            colorsTime={[10, 4, 3, 0]}
            onComplete={() => {
              setIsCountdownFinished(true);
            }}
          >
            {({ remainingTime }) => remainingTime}
          </CountdownCircleTimer>
        </div>
      </div>

      {/* Right Half (Video) */}
      {currentWorkoutSet !== 1 && (
        <div className={"w-1/2 h-full relative"}>
          <video
            ref={videoRef}
            className="border-[3px] border-[#cff947] absolute top-1/4 left-0 right-0 mx-auto"
            src={recordedVideoURL}
            controls={false}
            loop // Enable video looping
            style={{
              transform: `scaleX(-1) rotate(90deg) ${"translateX(-12px)"
                }`,
            }}
            width={VIDEO_WIDTH / MODIFIER}
          ></video>
        </div>
      )}
    </div>


  );
}