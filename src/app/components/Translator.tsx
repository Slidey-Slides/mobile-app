/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { GoogleGenAI } from "@google/genai";

const Translator: React.FC = () => {
    const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL!;

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const socketRef = useRef<WebSocket | null>(null);

    const [roomCode, setRoomCode] = useState("");
    const [connected, setConnected] = useState(false);
    const [status, setStatus] = useState<"idle" | "listening">("idle");
    const [transcripts, setTranscripts] = useState<string[]>([]);

    const [currentSlideIndex, setCurrentSlideIndex] = useState<number | null>(
        1
    );

    const getSlideContext = (slideshow: Array<any>) => {
        if (!slideshow.length || currentSlideIndex === null) {
            return { prev: null, current: null, next: null };
        }

        return {
            prev: slideshow[currentSlideIndex - 1] || null,
            current: slideshow[currentSlideIndex] || null,
            next: slideshow[currentSlideIndex + 1] || null,
        };
    };

    const handleOnResult = async (voiceText: string, slideshow: Array<any>) => {
        if (!API_KEY) return;

        const ai = new GoogleGenAI({ apiKey: API_KEY });

        const contextSlides = getSlideContext(slideshow);

        const prompt = `
        You are a slide navigation assistant. Based on the user's intent and slide content, respond with only "next", "prev", or "stay".

        Input voice: "${voiceText}"

        Previous Slide: ${JSON.stringify(contextSlides.prev)}
        Current Slide: ${JSON.stringify(contextSlides.current)}
        Next Slide: ${JSON.stringify(contextSlides.next)}
        `;

        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { thinkingConfig: { thinkingBudget: 0 } },
            });

            if (!response.text) {
                return;
            }

            const resultText = response.text.trim().toLowerCase();
            setTranscripts((prev) => [...prev, resultText]);

            if (
                socketRef.current &&
                (resultText === "next" || resultText === "prev")
            ) {
                const change = resultText === "next" ? "forward" : "backward";
                socketRef.current.send(
                    JSON.stringify({
                        event: "command",
                        source: "voice",
                        code: Number(roomCode),
                        change,
                    })
                );
                console.log("Sent command:", change);
            }
        } catch (err) {
            console.error("AI error:", err);
        }
    };

    const initSpeechRecognition = (slideshow: Array<any>) => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setStatus("listening");
        recognition.onresult = (e) =>
            handleOnResult(e.results[0][0].transcript, slideshow);
        recognition.onend = () => {
            setStatus("idle");
            setTimeout(() => recognition.start(), 300);
        };
        recognition.onerror = (e) => {
            console.error("Speech error:", e.error);
            setStatus("idle");
        };

        recognition.start();
        recognitionRef.current = recognition;
    };

    const connectToSocket = () => {
        if (!roomCode) return;

        const socket = new WebSocket(WS_URL);

        socket.onopen = () => {
            const joinPayload = {
                event: "join",
                source: "voice",
                code: Number(roomCode),
            };
            socket.send(JSON.stringify(joinPayload));
        };

        socket.onmessage = (msg) => {
            try {
                const data = JSON.parse(msg.data);
                console.log("WS message:", data);

                if (data.event === "join" && data.status === "ok") {
                    setConnected(true);
                    let parsed = [];
                    if (data.slideshowData) {
                        try {
                            parsed = JSON.parse(data.slideshowData);
                            console.log("Slideshow loaded:", parsed);
                        } catch (e) {
                            console.error("Failed to parse slideshowData", e);
                        }
                    }
                    initSpeechRecognition(parsed);
                }

                if (
                    data.event === "data" &&
                    typeof data.slideNumber === "number"
                ) {
                    setCurrentSlideIndex(data.slideNumber);
                    console.log("Current slide index set to", data.slideNumber);
                }
            } catch (err) {
                console.error("Invalid WS data:", err);
            }
        };

        socket.onerror = (err) => {
            console.error("Socket error:", err);
        };

        socket.onclose = () => {
            console.warn("Socket closed");
            setConnected(false);
        };

        socketRef.current = socket;
    };

    useEffect(() => {
        return () => {
            recognitionRef.current?.stop();
            socketRef.current?.close();
        };
    }, []);

    return (
        <div className="text-center max-w-md mx-auto p-4 space-y-4">
            {!connected ? (
                <>
                    <input
                        type="text"
                        placeholder="Enter Room Code"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        className="border p-2 w-full rounded"
                    />
                    <button
                        onClick={connectToSocket}
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Join Room
                    </button>
                </>
            ) : (
                <>
                    <div
                        className="w-6 h-6 rounded-full mx-auto"
                        style={{
                            backgroundColor:
                                status === "listening" ? "green" : "red",
                        }}
                    />
                    <p>{status === "listening" ? "Listening..." : "Idle"}</p>
                    {currentSlideIndex !== null && (
                        <p className="font-semibold text-lg">
                            Current Slide: {currentSlideIndex}
                        </p>
                    )}
                    <div className="text-left space-y-1">
                        {transcripts.map((text, index) => (
                            <p key={index} className="text-md">
                                {text}
                            </p>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default Translator;
