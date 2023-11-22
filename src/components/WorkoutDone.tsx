"use client";

// import { Button } from "@/components/ui/button";
import { TITLE_FOR_DISPLAY_OBJ } from "@/lib/utils";
import { WorkoutType } from "@/type/type";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import QRCode from "qrcode-generator";
import { useAtom } from "jotai";
import {
  // recordedVideoBlobArrAtom,
  // workoutTimeArrAtom,
  fileNameArrayAtom,
} from "@/lib/globalState/atom";

export function WorkoutDoneImpl() {
  const searchParams = useSearchParams();
  const workoutType = searchParams.get("workoutType") as WorkoutType;
  const numberOfSet = parseInt(searchParams.get("numberOfSet")!);
  const isDropout = JSON.parse(searchParams.get("isDropout")!) as boolean;
  const isGuideVideo = JSON.parse(searchParams.get("isGuideVideo")!) as boolean;
  const [fileNameArray, setFileNameArray] = useAtom(fileNameArrayAtom);

  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  useEffect(function initializeEventListener() {
    const filename = fileNameArray.at(0);
    if (filename) {
      generateQRCode(filename);
    } else {
      // alert("QR코드를 생성할 filename이 존재하지 않습니다");
    }
  });

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

  const workoutTypeForDisplay = TITLE_FOR_DISPLAY_OBJ[workoutType];

  // 페이지 로드시 filenameArray 0번에 들어있는 actToken으로 QRCode 생성
  // const [fileNameArray, setFileNameArray] = useAtom(fileNameArrayAtom);
  // useEffect(function initializeEventListener() {
  //   generateQRCode(fileNameArray[0]);
  // });

  // const qrCodeRef = useRef<HTMLCanvasElement>(null);
  // const generateQRCode = (filename: string) => {
  //   const url = process.env.NEXT_PUBLIC_BACKEND_HOST + '/video?actToken=' + filename;

  //   if (qrCodeRef.current) {
  //     try {
  //       const qr = QRCode(0, 'L'); // QR 코드 생성
  //       qr.addData(url);
  //       qr.make();

  //       const size = 150; // 원하는 크기로 조정 (예: 200px)

  //       // Canvas에 QR 코드 그리기
  //       const canvas = qrCodeRef.current;
  //       canvas.width = size; // Canvas의 폭 설정
  //       canvas.height = size; // Canvas의 높이 설정
  //       const context = canvas.getContext('2d');
  //       if (context) {
  //         const moduleCount = qr.getModuleCount();
  //         const cellSize = size / moduleCount;

  //         for (let row = 0; row < moduleCount; row++) {
  //           for (let col = 0; col < moduleCount; col++) {
  //             context.fillStyle = qr.isDark(row, col) ? 'black' : 'white';
  //             context.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
  //           }
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Error generating QR code:', error);
  //     }
  //   }
  // };

  return (
    <div className="bg-black w-screen h-screen flex flex-col justify-center items-center text-5xl text-white relative">
      <div className="flex flex-col gap-14">
        <div className="mt-[35%] flex flex-col items-center gap-2">
          <div className="text-4xl font-bold">
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
          <div className="mt-[20%] flex flex-col justify-center items-center gap-6">
            <div className="text-2xl font-bold">
              영상을 다운로드하고 볼 수 있어요!
            </div>

            <canvas
              ref={qrCodeRef}
              id="qr-code"
              className="w-[200px] h-[200px] rounded-2xl border-white border-[1vw]"
              style={{
                height: "200px",
                // position: "absolute",
                // top: "50px",
                // left: "10px",
              }}
            />

            <Link href={`/`} className="w-full">
              <button className=" w-full text-xl font-bold py-4 rounded-lg bg-[#383838] text-[#d9d9d9] cursor-pointer">
                운동 종료
              </button>
            </Link>
          </div>
        </div>

        {/* <div className="w-full text-xl font-bold py-4 rounded-lg cursor-pointer text-center mt-10 absolute bottom-40 left-1/2 transform -translate-x-1/2">
          운동을 다운로드하고 볼 수 있어요!
        </div> */}

        {/* <div className="w-full text-xl font-bold py-4 rounded-lg cursor-pointer">
          <canvas
            ref={qrCodeRef}
            id="qr-code"
            style={{
              position: "absolute",
              bottom: "20px", // Adjust the distance from the bottom as needed
              left: "50%", // Center horizontally
              transform: "translateX(-50%)", // Center horizontally
            }}
          />
        </div> */}
      </div>
    </div>
  );

}
