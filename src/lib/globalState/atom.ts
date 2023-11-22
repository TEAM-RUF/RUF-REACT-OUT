import { atom } from "jotai";

export const recordedVideoBlobArrAtom = atom<{right : Blob[] , left : Blob[]}>({right : [] , left : []});
export const recordedLeftVideoBlobAtom = atom<Blob[]>([]);
export const recordedRightVideoBlobAtom = atom<Blob[]>([]);

export const workoutTimeArrAtom = atom<number[]>([]);

export const fileNameArrayAtom = atom<string[]>([]);
