import { MODIFIER, VIDEO_HEIGHT, VIDEO_WIDTH } from "@/lib/movenet/params";

type GuideVideoProps = {
  guideVideoRef: React.MutableRefObject<HTMLVideoElement | null>;
  workoutType: string;
  isReplay?: boolean;
};

export function GuideVideo({
  guideVideoRef,
  workoutType,
  isReplay,
}: GuideVideoProps) {
  return (
    <div className="w-full relative flex justify-center">
      <div
        className=" absolute flex justify-center pt-5 pb-5 text-white text-4xl font-bold"
        style={
          {
            // width: VIDEO_WIDTH,
          }
        }
      >
        Guide
      </div>
      <iframe
        className="border-[3px] border-[#0acf83]"
        src={
          workoutType === "bench_press"
            ? "https://www.youtube.com/embed/1wbsM7vYB3U?autoplay=1&loop=1&mute=1&playlist=1wbsM7vYB3U"
            : workoutType === "squat"
              ? "https://www.youtube.com/embed/mKMlhY2FIwc?autoplay=1&loop=1&mute=1&playlist=mKMlhY2FIwc"
              : workoutType === "deadlift"
                ? "https://www.youtube.com/embed/eCu0ELMje3Y?autoplay=1&loop=1&mute=1&playlist=eCu0ELMje3Y"
                : ""
        }
        allow="autoplay;"
        width={isReplay ? VIDEO_HEIGHT / MODIFIER : VIDEO_HEIGHT}
        height={isReplay ? VIDEO_WIDTH / MODIFIER : VIDEO_WIDTH}
      // width={VIDEO_WIDTH}
      // width={512}
      ></iframe >
    </div>
  );
}

export default GuideVideo;
