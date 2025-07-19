"use client";
import React, { useState, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";

type TranslatorProps = {};

const Translator: React.FC<TranslatorProps> = () => {
  const API_KEY = process.env.GEMINI_API_KEY;
  let isActive = false;
  let isSpeechDeteched = false;
  const language = "en-US";

  const [message, setMessage] = useState("");
  const [switchState, setSwitchState] = useState<any>([]);

  const handleOnResult = async (voiceText: string) => {
    console.log("Speech deteched");

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a slide navigation model. Only respond with "next", "prev", or "stay" based on the speaker's intent. Input : ${voiceText}`,
      config: {
        thinkingConfig: {
          thinkingBudget: 0, // Disables thinking
        },
      },
    });

    console.log(response.text);
    setSwitchState((prev) => [...prev, response.text]);
  };

  const speechDetected = (recogObj: SpeechRecognition) => {
    console.log("Start speech detection");

    recogObj.onresult = (event) => handleOnResult(event.results[0][0].transcript);
    recogObj.start();
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";

    recognition.onresult = (event) => handleOnResult(event.results[0][0].transcript);

    recognition.onend = async (event) => {
      setTimeout(() => speechDetected(recognition), 200);
    };

    recognition.start();
  }, []);

  return (
    <div className="text-center">
      <div className="w-6 h-6" style={{ backgroundColor: switchState ? "green" : "red" }}></div>
      <p>Click to start speech recognition</p>

      <p className="text-2xl">{message}</p>
      {switchState.map((text: string) => {
        return (
          <p key={Math.random()} className="text-2xl">
            {text}
          </p>
        );
      })}
    </div>
  );
};
export default Translator;
