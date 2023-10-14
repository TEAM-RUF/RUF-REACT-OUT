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
      <video
        ref={guideVideoRef}
        className="border-[3px] border-[#0acf83]"
        src={
          workoutType === "bench_press"
            ? "../../example_movies/bench_press.mp4"
            : workoutType === "squat"
            ? "../../example_movies/squat.mp4"
            : workoutType === "deadlift"
            ? "../../example_movies/deadlift.mp4"
            : ""
        }
        autoPlay={false}
        muted
        loop
        width={isReplay ? VIDEO_HEIGHT / MODIFIER : VIDEO_HEIGHT}
        height={isReplay ? VIDEO_WIDTH / MODIFIER : VIDEO_WIDTH}
        // width={VIDEO_WIDTH}
        // width={512}
      ></video>
    </div>
  );
}

export default GuideVideo;
