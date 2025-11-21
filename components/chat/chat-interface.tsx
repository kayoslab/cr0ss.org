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

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

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
          Ask me anything about Simon&apos;s professional background, expertise, or blog posts
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

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-[80%]">
              <p className="text-sm">{error}</p>
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
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400 bg-gray-50 text-gray-900 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-900"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
