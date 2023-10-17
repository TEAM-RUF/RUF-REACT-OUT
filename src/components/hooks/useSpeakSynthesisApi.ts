import { useCallback, useState } from "react";


export const useSpeachSynthesisApi = () => {

    const [speakText, setSpeakText] = useState<string>("안녕하세요 러프입니다. 한번 테스트해보세요");
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [isResumed, setIsResumed] = useState<boolean>(false);
    const [isEnded, setIsEnded] = useState<boolean>(false);


    const speak = useCallback(() => {
        console.log("Speaking : " + speakText);
        var msg = new SpeechSynthesisUtterance();

        msg.text = <string>speakText;
        function speak() {
            window.speechSynthesis.speak(msg);
        }
        speak();
        setIsSpeaking(true);
        setIsEnded(false);
    }, [speakText]);

    const pause = useCallback(() => {
        function pause() {
            window.speechSynthesis.pause();
        }
        pause();
        setIsPaused(true);
        setIsSpeaking(false);
        setIsEnded(false);
        setIsResumed(false);
    }, []);

    const resume = useCallback(() => {
        function resume() {
            window.speechSynthesis.resume();
        }
        resume();
        setIsPaused(false);
        setIsSpeaking(false);
        setIsEnded(false);
        setIsResumed(true);
    }, []);

    const cancel = useCallback(() => {
        function cancel() {
            window.speechSynthesis.cancel();
        }
        cancel();
        setIsPaused(false);
        setIsResumed(false);

        setIsSpeaking(false);
        setIsEnded(true);
    }, []);
    return {
        speakText,
        setSpeakText,
        isSpeaking,
        isPaused,
        isResumed,
        isEnded,
        speak,
        pause,
        resume,
        cancel

    }
}

// https://github.com/kumard3/next-js-text-to-speech/tree/main