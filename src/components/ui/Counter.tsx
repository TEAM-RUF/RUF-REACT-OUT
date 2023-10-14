import React, { useState } from "react";
import { ActionType } from "../Ready";

interface CounterProps {
  currentValue: number;
  counterType: "REPS" | "SETS" | "REST";
  repIndex?: number;
  updateOptions: React.Dispatch<
    ActionType &
      Partial<{
        workout_type: string;
        numberOfSet: number;
        numberOfRep: number[];
        restInterval: number;
        isGuideVideo: boolean;
      }>
  >;
}

export const Counter: React.FC<CounterProps> = ({
  currentValue,
  counterType,
  updateOptions,
  repIndex,
}) => {
  return (
    <div className="w-full flex justify-between text-white border-[#5c59ff] border-2 bg-white px-4 py-4 rounded-xl">
      <button
        className="text-[#5c59ff]"
        onClick={() =>
          updateOptions({
            type: counterType,
            valueForChange: currentValue - 1,
            repIndex,
          })
        }
      >
        -
      </button>
      <span className="font-bold text-[#5c59ff]">{currentValue}</span>
      <button
        className="text-[#5c59ff]"
        onClick={() =>
          updateOptions({
            type: counterType,
            valueForChange: currentValue + 1,
            repIndex,
          })
        }
      >
        +
      </button>
    </div>
  );
};
