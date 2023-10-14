"use client";

import { CountdownCircleTimer } from "react-countdown-circle-timer";

export function Countdown({
  countdownDuration,
  setIsCountdownFinished,
}: {
  countdownDuration: number;
  setIsCountdownFinished: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="bg-black w-screen h-screen flex justify-center items-center">
      <div className="text-9xl text-white font-bold">
        <CountdownCircleTimer
          isPlaying
          duration={countdownDuration}
          size={280}
          colors={["#5c59ff", "#5c59ff", "#FF0000", "#FF0000"]}
          // colors={["#004777", "#004777", "#004777", "#004777"]}
          colorsTime={[10, 4, 3, 0]}
          onComplete={() => {
            setIsCountdownFinished(true);
          }}
        >
          {({ remainingTime }) => remainingTime}
        </CountdownCircleTimer>
      </div>
    </div>
  );
}
