"use client";

import { useState, useRef, useEffect } from "react";
import { Message } from "./message";
import { SuggestedQuestions } from "./suggested-questions";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  modelName?: string;
}

interface RateLimitState {
  isLimited: boolean;
  retryAfterSec: number;
  resetTime: number | null;
}

/**
 * Format seconds into a human-readable duration
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return minutes > 0
      ? `${hours}h ${minutes}m`
      : `${hours}h`;
  }
  return minutes > 0 ? `${minutes}m` : "less than a minute";
}

// Fun quirky words to cycle through while loading
const LOADING_WORDS = [
  "Pondering",
  "Cogitating",
  "Ruminating",
  "Noodling",
  "Percolating",
  "Mulling",
  "Contemplating",
  "Brainstorming",
  "Synthesizing",
  "Connecting dots",
  "Mining memories",
  "Sifting thoughts",
  "Brewing ideas",
  "Churning neurons",
  "Spinning gears",
  "Consulting oracles",
  "Reading tea leaves",
  "Consulting the void",
  "Channeling wisdom",
  "Assembling words",
  "Untangling threads",
  "Weaving narratives",
  "Decoding signals",
  "Harvesting insights",
  "Distilling essence",
  "Calibrating thoughts",
  "Aligning stars",
  "Summoning knowledge",
  "Excavating data",
  "Polishing prose",
  "Crystallizing ideas",
  "Tuning frequencies",
  "Parsing patterns",
  "Stirring the pot",
  "Warming up synapses",
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingWord, setLoadingWord] = useState(LOADING_WORDS[0]);
  const [rateLimit, setRateLimit] = useState<RateLimitState>({
    isLimited: false,
    retryAfterSec: 0,
    resetTime: null,
  });
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cycle through loading words
  useEffect(() => {
    if (!isLoading) return;

    let wordIndex = 0;
    const interval = setInterval(() => {
      wordIndex = (wordIndex + 1) % LOADING_WORDS.length;
      setLoadingWord(LOADING_WORDS[wordIndex]);
    }, 3500); // 3.5 seconds between words

    return () => clearInterval(interval);
  }, [isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Countdown timer for rate limit
  useEffect(() => {
    if (!rateLimit.isLimited || !rateLimit.resetTime) return;

    const updateTimeRemaining = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((rateLimit.resetTime! - now) / 1000));

      if (remaining <= 0) {
        setRateLimit({ isLimited: false, retryAfterSec: 0, resetTime: null });
        setTimeRemaining("");
        setError(null);
      } else {
        setTimeRemaining(formatDuration(remaining));
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [rateLimit.isLimited, rateLimit.resetTime]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading || rateLimit.isLimited) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: messageText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle rate limit specifically
        if (response.status === 429 && errorData.code === "RATE_LIMIT_EXCEEDED") {
          const retryAfterSec = errorData.details?.retryAfterSec || 43200; // 12 hours default
          const resetTime = Date.now() + retryAfterSec * 1000;

          setRateLimit({
            isLimited: true,
            retryAfterSec,
            resetTime,
          });
          setTimeRemaining(formatDuration(retryAfterSec));
          throw new Error(`You've reached your chat limit (10 messages per 12 hours). Try again in ${formatDuration(retryAfterSec)}.`);
        }

        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response,
        timestamp: data.timestamp,
        modelName: data.model?.name,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="py-8 bg-white">
        <h1 className="text-2xl font-semibold text-gray-900">
          Chat with AI Assistant
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Ask me anything about Simon&apos;s professional background, expertise, or blog posts.
          <span className="text-gray-400 ml-1">Powered by GPT-4o Mini.</span>
        </p>
      </div>

      {/* Messages Container */}
      <div className="space-y-6">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">
                Welcome! How can I help you today?
              </h2>
              <p className="text-gray-600">
                Try one of these questions to get started:
              </p>
            </div>
            <SuggestedQuestions onQuestionClick={handleSuggestedQuestion} />
          </div>
        )}

        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}

        {isLoading && (
          <div className="flex items-center space-x-3 py-2">
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
            <span className="text-sm text-gray-500 italic transition-opacity duration-200">
              {loadingWord}...
            </span>
          </div>
        )}

        {error && !rateLimit.isLimited && (
          <div className="flex justify-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-[80%]">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {rateLimit.isLimited && (
          <div className="flex justify-center">
            <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-4 rounded-lg max-w-[80%]">
              <p className="font-medium mb-1">Chat limit reached</p>
              <p className="text-sm">
                You&apos;ve used your 10 messages for this 12-hour period.
                {timeRemaining && (
                  <> Try again in <span className="font-semibold">{timeRemaining}</span>.</>
                )}
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 pt-4 pb-2 bg-white mt-6">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={rateLimit.isLimited ? "Chat limit reached" : "Type your message..."}
            disabled={isLoading || rateLimit.isLimited}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400 bg-gray-50 text-gray-900 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || rateLimit.isLimited}
            className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-900"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
