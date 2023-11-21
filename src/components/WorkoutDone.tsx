"use client";

// import { Button } from "@/components/ui/button";
import { TITLE_FOR_DISPLAY_OBJ } from "@/lib/utils";
import { WorkoutType } from "@/type/type";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function WorkoutDoneImpl() {
  const searchParams = useSearchParams();
  const workoutType = searchParams.get("workoutType") as WorkoutType;
  const numberOfSet = parseInt(searchParams.get("numberOfSet")!);
  const isDropout = JSON.parse(searchParams.get("isDropout")!) as boolean;
  const isGuideVideo = JSON.parse(searchParams.get("isGuideVideo")!) as boolean;

  const workoutTypeForDisplay = TITLE_FOR_DISPLAY_OBJ[workoutType];
  return (
    <div className="bg-black w-screen h-screen flex flex-col justify-center items-center text-5xl  text-white">
      <div className="flex flex-col gap-14">
        <div className="flex flex-col items-center gap-2">
          <div className="">
            {workoutTypeForDisplay} {isDropout ? numberOfSet - 1 : numberOfSet}
            세트 완료 👏
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Link href={`/replay?${searchParams.toString()}`}>
            <button className="w-full text-xl font-bold py-4 rounded-lg bg-[#cff947] text-black cursor-pointer">
              운동 영상 다시보기
            </button>
          </Link>
          <Link href={`/`}>
            <button className="w-full text-xl font-bold py-4 rounded-lg bg-[#383838] text-[#d9d9d9] cursor-pointer">
              운동 종료
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
