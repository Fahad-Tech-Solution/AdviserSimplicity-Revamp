import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import {
  ttsTextAtom,
  ttsTopicAtom,
  ttsStateAtom,
  ttsSpeedAtom,
  ttsVoiceAtom,
} from "../store/authState"; // adjust path as needed

export const useTextToSpeech = () => {
  const [text, setText] = useAtom(ttsTextAtom);
  const [topic, setTopic] = useAtom(ttsTopicAtom);
  const [speechState, setSpeechState] = useAtom(ttsStateAtom);
  const [speed, setSpeed] = useAtom(ttsSpeedAtom);
  const [voiceURI, setVoiceURI] = useAtom(ttsVoiceAtom);

  const utteranceRef = useRef(null);

  useEffect(() => {
    if (!("speechSynthesis" in window) || !text) return;

    const synth = window.speechSynthesis;
    synth.cancel(); // Clear queue before starting

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;

    if (voiceURI) {
      const voices = synth.getVoices();
      const selected = voices.find(
        (v) => v.voiceURI === voiceURI || v.name === voiceURI
      );
      if (selected) utterance.voice = selected;
    }

    // Sync Jotai state accurately using native Web Speech events
    utterance.onstart = () => {
      setSpeechState("speaking");
    };

    utterance.onpause = () => {
      setSpeechState("paused");
    };

    utterance.onresume = () => {
      setSpeechState("speaking");
    };

    utterance.onend = () => {
      setSpeechState("stopped");
      setText("");
      setTopic("");
    };

    utterance.onerror = () => {
      setSpeechState("stopped");
    };

    utteranceRef.current = utterance;
    synth.speak(utterance);
  }, [text]);

  const speak = (newText, topicTitle = "") => {
    // If user clicks play on the exact same text while playing/paused, toggle pause/resume
    if (text === newText && speechState === "speaking") {
      pause();
      return;
    }
    if (text === newText && speechState === "paused") {
      resume();
      return;
    }

    setTopic(topicTitle);
    setText(newText);
  };

  const pause = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.pause();
      setSpeechState("paused");
    }
  };

  const resume = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.resume();
      setSpeechState("speaking");
    }
  };

  const stop = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeechState("stopped");
      setText("");
      setTopic("");
    }
  };

  const toggle = (newText = "", topicTitle = "") => {
    if (speechState === "speaking") {
      pause();
    } else if (speechState === "paused") {
      resume();
    } else if (newText) {
      speak(newText, topicTitle);
    }
  };

  return {
    speechState,
    currentText: text,
    currentTopic: topic,
    speed,
    setSpeed,
    voiceURI,
    setVoiceURI,
    speak,
    pause,
    resume,
    stop,
    toggle,
  };
};