"use client";

import { useEffect, useState } from "react";

export function FullScreenBtn() {
  const [isFullScreen, setisFullScreen] = useState<boolean | null>(null);

  useEffect(() => {
    const maxHeight = window.screen.height;
    const maxWidth = window.screen.width;
    const curHeight = window.innerHeight;
    const curWidth = window.innerWidth;

    if (
      document.fullscreenElement ||
      (maxWidth == curWidth && maxHeight == curHeight)
    ) {
      setisFullScreen(true);
    } else {
      setisFullScreen(false);
    }
  }, []);

  const doFullScreen = () => {
    window.document.documentElement.requestFullscreen();
    setisFullScreen(true);
  };

  return (
    <>
      {isFullScreen === false && (
        <div
          className="border-2 border-slate-100 absolute top-[50%] left-[50%] rounded-3xl bg-slate-800 text-white z-[100] p-10 cursor-pointer"
          style={{
            transform: "translate(-50%, -50%)",
          }}
          onClick={doFullScreen}
        >
          <div className="text-2xl font-[500]">
            여기를 클릭하여 풀스크린으로 전환하세요
          </div>
        </div>
      )}
    </>
  );
}
