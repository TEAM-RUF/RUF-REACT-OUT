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
} from "@/lib/globalState/atom";
import { useAtom } from "jotai";
// SpeachSynthesisApi import
import { useSpeachSynthesisApi } from "./hooks/useSpeakSynthesisApi";

import QRCode from 'qrcode-generator';

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

  useEffect(function initialize() {
    (async () => {
      setRecordedVideoBlobArr([]);
      setWorkoutTimeArr([]);
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


  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateQRCode = () => {
      const url = 'https://example.com'; // 원하는 URL을 여기에 입력

      if (qrCodeRef.current) {
        try {
          const qr = QRCode(0, 'L'); // QR 코드 생성
          qr.addData(url);
          qr.make();

          // QR 코드 크기 설정
          const size = 200; // 원하는 크기로 조정 (예: 200px)

          // Canvas에 QR 코드 그리기
          const canvas = qrCodeRef.current;
          canvas.width = size; // Canvas의 폭 설정
          canvas.height = size; // Canvas의 높이 설정
          const context = canvas.getContext('2d');
          if (context) {
            const moduleCount = qr.getModuleCount();
            const cellSize = size / moduleCount;

            for (let row = 0; row < moduleCount; row++) {
              for (let col = 0; col < moduleCount; col++) {
                context.fillStyle = qr.isDark(row, col) ? 'black' : 'white';
                context.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
              }
            }
          }
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      }
    };

    generateQRCode();
  }, []);


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
              visibility: currentPhase === 2 ? "visible" : "hidden"
            }}
          />
        </div>
      </div>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <canvas ref={qrCodeRef} id="qr-code" />
      </div>
      {currentPhase === 1 && (
        <>
          <Select
            onValueChange={(e) =>
              updateOptions({ type: "WORKOUT_TYPE", workout_type: e })
            }
          >
            <SelectTrigger className="w-[23%]">
              <SelectValue
                placeholder="Bench Press"
                defaultValue={options.workout_type}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bench_press">Bench Press</SelectItem>
              <SelectItem value="deadlift">Deadlift</SelectItem>
              <SelectItem value="squat">Squat</SelectItem>
            </SelectContent>
          </Select>
          <div className="w-[23%]">
            <button
              className="w-full text-xl font-bold py-4 rounded-lg bg-[#08aa6c] text-white cursor-pointer"
              onClick={() => setCurrentPhase(2)}
            >
              다음
            </button>
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
              <div className="flex items-center h-full pl-[85%]">
                <div className="text-2xl font-bold text-[#d9d9d9]">Set(s)</div>
              </div>
              <div className="flex items-center h-full pl-[85%]">
                <div className="text-2xl font-bold text-[#d9d9d9]">Rep(s)</div>
              </div>
              <div className="flex items-center h-full pl-[85%]">
                <div className="text-2xl font-bold text-[#d9d9d9]">Rest</div>
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
            <div className="w-full flex flex-col gap-6">
              <button
                className="w-full text-xl font-bold py-4 rounded-lg bg-[#7b3eff] text-white cursor-pointer"
                onClick={() => gotoNextPage({ isGuideVideo: false })}
              >
                혼자 운동하기
              </button>
              <button
                className="w-full text-xl font-bold py-4 rounded-lg bg-[#08aa6c] text-white cursor-pointer"
                onClick={() => gotoNextPage({ isGuideVideo: true })}
              >
                가이드와 운동하기
              </button>
            </div>
            <div className="w-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}
