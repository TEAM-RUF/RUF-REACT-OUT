import { atom } from "jotai";

export const recordedVideoBlobArrAtom = atom<{right : Blob[] , left : Blob[]}>({right : [] , left : []});

export const workoutTimeArrAtom = atom<number[]>([]);

export const fileNameArrayAtom = atom<string[]>([]);
