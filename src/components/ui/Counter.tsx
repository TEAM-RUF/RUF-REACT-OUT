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
    <div className="w-full flex justify-between bg-[#393939] text-white   px-4 py-4 rounded-xl">
      <button
        className="text-[#878787]"
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
      <span className="font-[600] text-[#cff947]">{`${currentValue} ${counterType === "REST" ? "초" : counterType === "SETS" ? "세트" : ""}`}</span>
      <button
        className="text-[#878787]"
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
