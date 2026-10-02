"use client";

import { useState, useEffect } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const { isListening, isSupported, transcript, interimTranscript, startListening, stopListening, resetTranscript } = useSpeechRecognition();

  // Update textarea with speech transcript
  useEffect(() => {
    if (transcript) {
      setValue(transcript);
    }
  }, [transcript]);

  // Show interim results while listening
  useEffect(() => {
    if (isListening && interimTranscript) {
      setValue(interimTranscript);
    }
  }, [interimTranscript, isListening]);

  function handleSend() {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
    resetTranscript();
    if (isListening) {
      stopListening();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter inserts a newline, same as most chat apps.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function toggleListening() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-base-border bg-base-bg p-4">
      {isSupported && (
        <button
          onClick={toggleListening}
          disabled={disabled}
          aria-label={isListening ? "Stop listening" : "Start voice input"}
          className={`rounded-md p-2 transition-colors ${
            isListening
              ? "bg-prism text-white animate-pulse"
              : "text-ink-muted hover:bg-base-raised hover:text-ink-primary"
          } disabled:opacity-40`}
        >
          {isListening ? "🎙️" : "🎤"}
        </button>
      )}
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isListening ? "Listening..." : "Message Prism-AI…"}
        rows={1}
        className="max-h-40 flex-1 resize-none rounded-md border border-base-border bg-base-surface px-3 py-2 text-sm text-ink-primary placeholder:text-ink-faint"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="rounded-md bg-ultron px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ultron-hover disabled:opacity-40"
      >
        Send
      </button>
    </div>
  );
}
