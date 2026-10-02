"use client";

import { useEffect, useRef, useState } from "react";

interface SpeechOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);

      // Load voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);

        // Try to find a British male voice (Jarvis-style)
        const britishMaleVoice = availableVoices.find(
          (voice) =>
            (voice.lang.includes("en-GB") || voice.lang.includes("en_GB")) &&
            (voice.name.toLowerCase().includes("male") ||
             voice.name.toLowerCase().includes("daniel") ||
             voice.name.toLowerCase().includes("google uk") ||
             voice.name.toLowerCase().includes("david"))
        ) || availableVoices.find(
          (voice) => voice.lang.includes("en-GB") || voice.lang.includes("en_GB")
        );

        if (britishMaleVoice) {
          setSelectedVoice(britishMaleVoice);
        }
      };

      loadVoices();

      // Voices load asynchronously in some browsers
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = (text: string, options?: SpeechOptions) => {
    if (!isSupported || !isEnabled) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Use selected voice or provided voice
    if (options?.voice) {
      utterance.voice = options.voice;
    } else if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Jarvis-style settings: professional, direct, energetic
    utterance.rate = options?.rate ?? 1.0; // Normal speed
    utterance.pitch = options?.pitch ?? 0.9; // Slightly lower for professional tone
    utterance.volume = options?.volume ?? 1.0; // Full volume

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    utteranceRef.current = null;
  };

  const toggleEnabled = () => {
    setIsEnabled((prev) => !prev);
    if (isSpeaking) {
      stop();
    }
  };

  return {
    isSpeaking,
    isSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
    isEnabled,
    speak,
    stop,
    toggleEnabled,
  };
}
