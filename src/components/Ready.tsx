"use client";

import Image from "next/image";
import Logo from "../../public/logo.png";
import PreviousArrow from "../../public/previous_arrow.png";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useReducer, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Counter } from "./ui/Counter";
import { TITLE_FOR_DISPLAY_OBJ } from "@/lib/utils";
import {
  recordedVideoBlobArrAtom,
  workoutTimeArrAtom,
  fileNameArrayAtom,
} from "@/lib/globalState/atom";
import { atom, useAtom } from "jotai";
// SpeachSynthesisApi import
import { useSpeachSynthesisApi } from "./hooks/useSpeakSynthesisApi";
import { IconBeta } from "@/lib/icons/beta";

const INIT_STATE = {
  workout_type: "bench_press",
  numberOfSet: 3,
  numberOfRep: [10, 10, 10],
  restInterval: 40,
  isGuideVideo: false,
};

export type ActionType = {
  type: "WORKOUT_TYPE" | "REPS" | "SETS" | "REST" | "INITIALIZE";
  repIndex?: number;
  valueForChange?: number;
};

export type ActionAndStateType = ActionType & Partial<typeof INIT_STATE>;

export function Ready() {
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

  const router = useRouter();
  const [currentPhase, setCurrentPhase] = useState<1 | 2>(1);
  const [, setRecordedVideoBlobArr] = useAtom(recordedVideoBlobArrAtom);
  const [, setWorkoutTimeArr] = useAtom(workoutTimeArrAtom);
  const [, setFileNameArr] = useAtom(fileNameArrayAtom);

  useEffect(function initialize() {
    (async () => {
      setRecordedVideoBlobArr({ left: [], right: [] });
      setWorkoutTimeArr([]);
      setFileNameArr([]);
      const res = await navigator.permissions.query({ name: "camera" as any });
      if (res.state !== "granted") {
        navigator.mediaDevices.getUserMedia({ video: true });
      } else {
      }
    })();
  }, []);

  const [options, updateOptions] = useReducer(
    (prev: typeof INIT_STATE, action: ActionAndStateType) => {
      switch (action.type) {
        case "INITIALIZE":
          return { ...INIT_STATE };
        case "REPS":
          if (!action.valueForChange || action.valueForChange <= 0)
            return { ...prev };

          const repIndex = action.repIndex!;
          const newNumberOfRep = [...prev.numberOfRep];
          newNumberOfRep[repIndex] = action.valueForChange!;
          return { ...prev, numberOfRep: newNumberOfRep };
        case "SETS":
          if (
            action.valueForChange &&
            action.valueForChange > 0 &&
            action.valueForChange! <= 5
          ) {
            return {
              ...prev,
              numberOfSet: action.valueForChange!,
              numberOfRep: Array(action.valueForChange!).fill(10),
            };
          } else {
            return { ...prev };
          }
        case "REST":
          return action.valueForChange && action.valueForChange > 0
            ? { ...prev, restInterval: action.valueForChange! }
            : { ...prev };
        case "WORKOUT_TYPE":
          return { ...prev, workout_type: action.workout_type! };
        default:
          return { ...prev };
      }
    },
    INIT_STATE
  );

  const gotoNextPage = ({ isGuideVideo }: { isGuideVideo: boolean }) => {
    const newOptions = { ...options, isGuideVideo };
    const searchParams = new URLSearchParams(newOptions as any).toString();
    router.push(`/movenet_v2?${searchParams}`);
  };

  const titleForDisplay = TITLE_FOR_DISPLAY_OBJ[options.workout_type];

  const initializeEverything = () => {
    setCurrentPhase(1);
    updateOptions({ type: "INITIALIZE" });
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center gap-10 text-3xl bg-black">
      <div className="fixed w-full px-10 py-4 top-0 left-0 flex items-center justify-between">
        <div className="flex flex-col items-center gap-6">
          <Image src={Logo} alt="로고" width={190} />
          <Image
            onClick={initializeEverything}
            src={PreviousArrow}
            alt="이전으로 돌아가기"
            style={{
              visibility: currentPhase === 2 ? "visible" : "hidden",
            }}
          />
        </div>
      </div>

      {currentPhase === 1 && (
        <>
          <Select
            onValueChange={(e) =>
              updateOptions({ type: "WORKOUT_TYPE", workout_type: e })
            }
          >
            <SelectTrigger className="w-[35%]">
              <SelectValue
                placeholder="Bench Press"
                defaultValue={options.workout_type}
              />
            </SelectTrigger>
            <SelectContent
              ref={(ref) => {
                if (!ref) return;
                ref.ontouchstart = (e) => {
                  e.preventDefault();
                };
              }}
            >
              <SelectItem value="bench_press">Bench Press</SelectItem>
              <SelectItem value="deadlift">Deadlift</SelectItem>
              <SelectItem value="squat">Squat</SelectItem>
              <SelectItem value="let_pull_down">Let Pull Down</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-col w-full items-center gap-4">
            <div className="w-[35%]">
              <button
                className="w-full text-xl font-bold py-4 rounded-lg bg-[#cff947] text-black cursor-pointer"
                onClick={() => setCurrentPhase(2)}
              >
                다음
              </button>
            </div>
            <div className="w-[35%]">
              <button
                className="w-full text-xl font-bold py-4 rounded-lg bg-[#383838] text-[#d9d9d9] cursor-pointer"
                onClick={() => alert("준비중입니다")}
              >
                운동 방법 보기
              </button>
            </div>
          </div>
        </>
      )}
      {currentPhase === 2 && (
        <div className="flex  flex-col w-[100%] text-white gap-20">
          <div className="text-center text-8xl">
            <div className=""></div>
            <div
              className="text-white font-[500] text-[100%]"
              style={{
                fontFamily: "Inter",
              }}
            >
              {titleForDisplay}
            </div>
            <div className=""></div>
          </div>
          <div className="flex flex-1 gap-6">
            <div className="flex flex-col w-full items-start gap-6 ">
              <div className="flex items-center h-full pl-[75%]">
                <div className="text-2xl font-bold text-[#d9d9d9]">세트 수</div>
              </div>
              <div className="flex items-center h-full pl-[72%]">
                <div className="text-2xl font-bold text-[#d9d9d9]">
                  반복 횟수
                </div>
              </div>
              <div className="flex items-center h-full pl-[72%]">
                <div className="text-2xl font-bold text-[#d9d9d9]">
                  쉬는 시간
                </div>
              </div>
            </div>
            <div className="flex flex-col w-full gap-6">
              <div className="flex items-center justify-center">
                <Counter
                  counterType="SETS"
                  currentValue={options.numberOfSet}
                  updateOptions={updateOptions}
                />
              </div>
              <div className="flex gap-2">
                {options.numberOfRep.map((rep, index) => {
                  return (
                    <Counter
                      key={`${options.numberOfRep}_${index}`}
                      repIndex={index}
                      currentValue={rep}
                      counterType="REPS"
                      updateOptions={updateOptions}
                    />
                  );
                })}
              </div>
              <div className="">
                <Counter
                  currentValue={options.restInterval}
                  counterType="REST"
                  updateOptions={updateOptions}
                />
              </div>
            </div>
            <div className="flex flex-col w-full"></div>
          </div>
          <div className="flex w-full ">
            <div className="w-full"></div>

            <div className="relative w-full flex flex-col gap-6">
              <IconBeta />

              <button
                className="w-full text-xl font-bold py-4 rounded-lg bg-[#cff947] text-black cursor-pointer"
                onClick={() => gotoNextPage({ isGuideVideo: true })}
              >
                AI와 운동하기
              </button>

              {/* <svg width="86" height="38" viewBox="0 0 86 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M20.4611 0C10.7961 0 2.96106 7.83502 2.96106 17.5C2.96106 20.1499 3.55004 22.6623 4.60423 24.9133L0 37.3123L15.6102 34.319C17.1505 34.7624 18.778 35 20.4611 35H68.4611C78.126 35 85.9611 27.165 85.9611 17.5C85.9611 7.83502 78.126 0 68.4611 0H20.4611Z" fill="#878787"/>
</svg> */}

              <button
                className="w-full text-xl font-bold py-4 rounded-lg bg-[#393939] text-[#d9d9d9] cursor-pointer"
                onClick={() => gotoNextPage({ isGuideVideo: false })}
              >
                자율 운동하기
              </button>
            </div>
            <div className="w-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}
