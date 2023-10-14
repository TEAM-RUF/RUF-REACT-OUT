import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function writeLoadingToCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "lightgray";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = "80px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText("LOADING···", canvas.width / 2, canvas.height / 2);
}

export const TITLE_FOR_DISPLAY_OBJ: Record<string, string> = {
  bench_press: "Bench Press",
  deadlift: "Deadlift",
  squat: "Squat",
};