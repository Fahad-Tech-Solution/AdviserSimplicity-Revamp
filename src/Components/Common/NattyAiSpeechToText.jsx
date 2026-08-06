import React, { useState, useEffect, useRef } from "react";
import { Button, Typography, message } from "antd";
import { AudioOutlined, StopFilled } from "@ant-design/icons";
import NattyImage from "../../assets/image/ProfileImages/NattyAI.png";

const NattyAiSpeechToText = ({ editing, onTranscript }) => {
  const { Text } = Typography;
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");

  const recognitionRef = useRef(null);
  const startingRef = useRef(false); // synchronous guard against double-start
  // Keep a ref to the latest callback to avoid stale closure issues
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      startingRef.current = false;
    };

    recognition.onresult = (event) => {
      let currentTranscript = "";

      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }

      setLiveTranscript(currentTranscript);

      // Trigger external form callback using ref to ensure latest function reference
      if (onTranscriptRef.current) {
        onTranscriptRef.current(currentTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      startingRef.current = false;

      if (event.error === "not-allowed") {
        message.error("Microphone access was denied. Please check permissions.");
      } else if (event.error !== "no-speech") {
        message.error(`Recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      startingRef.current = false;
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []); // Run once on mount

  const handleStart = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      message.warning(
        "Speech recognition is not supported in this browser. Please use Chrome or Edge."
      );
      return;
    }

    if (startingRef.current || isListening) {
      // Prevents a second start() call from aborting the session that's
      // already starting (which throws InvalidStateError / "aborted").
      return;
    }

    if (recognitionRef.current) {
      startingRef.current = true;
      setLiveTranscript("");
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("start() threw:", err.name, err.message);
        startingRef.current = false;
      }
    }
  };

  const handleStop = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 600,
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "1.5px solid #2563eb",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fff",
            flexShrink: 0,
          }}
        >
          <img
            src={NattyImage}
            alt="Natty AI Avatar"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#1e3a8a",
            letterSpacing: "-0.2px",
          }}
        >
          Natty AI — Goal Description
        </span>
      </div>

      {/* Main Container */}
      {editing ? (
        <div
          style={{
            backgroundColor: "#f0f7ff",
            border: "1px solid #cce3fe",
            borderRadius: 16,
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 700,
              color: "#1d4ed8",
              lineHeight: 1.4,
            }}
          >
            Speak your goal in your own words — Natty will expand and rewrite it
            in plain English
          </p>

          {!isListening ? (
            /* DEFAULT BUTTON STATE */
            <Button
              type="primary"
              icon={<AudioOutlined style={{ fontSize: 16 }} />}
              onClick={handleStart}
              style={{
                width: "100%",
                height: 46,
                background:
                  "linear-gradient(135deg, rgb(59, 130, 246), rgb(29, 78, 216))",
                borderColor: "#2563eb",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
              }}
            >
              Tap & Speak Your Goal
            </Button>
          ) : (
            /* ACTIVE RECORDING STATE */
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 12,
                    height: 44,
                    padding: "0 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: "#ef4444",
                      display: "inline-block",
                      boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.2)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#991b1b",
                    }}
                  >
                    Recording — speak as long as you need
                  </span>
                </div>

                <Button
                  type="primary"
                  danger
                  icon={<StopFilled style={{ fontSize: 13 }} />}
                  onClick={handleStop}
                  style={{
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: "#ef4444",
                    borderColor: "#ef4444",
                    fontWeight: 700,
                    fontSize: 14,
                    padding: "0 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                  }}
                >
                  Stop
                </Button>
              </div>

              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #dbeafe",
                  borderRadius: 12,
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#3b82f6",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.5px",
                  }}
                >
                  <span style={{ fontSize: 13, lineHeight: 1 }}>••|••</span>
                  LISTENING
                </div>

                <div
                  style={{
                    fontSize: 13.5,
                    fontStyle: liveTranscript ? "normal" : "italic",
                    color: liveTranscript ? "#1e293b" : "#64748b",
                    minHeight: 22,
                  }}
                >
                  {liveTranscript || "Start speaking..."}
                </div>

                <div
                  style={{
                    fontSize: 11.5,
                    color: "#93c5fd",
                    fontWeight: 500,
                  }}
                >
                  Speak your full goal — press Stop when finished
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <Text
          style={{
            fontSize: 12,
            color: "#6b7280",
            textAlign: "start",
            marginTop: 8,
            display: "block",
          }}
        >
          No description yet — click Edit to add one
        </Text>
      )}
    </div>
  );
};

export default NattyAiSpeechToText;