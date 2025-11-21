import Markdown from "react-markdown";
import { ChatMessage } from "./chat-interface";

interface MessageProps {
  message: ChatMessage;
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === "user";

  if (isUser) {
    // User message: grey bubble, right-aligned
    return (
      <div className="flex justify-end">
        <div className="rounded-2xl px-4 py-3 max-w-[80%] bg-gray-200 text-gray-900">
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        </div>
      </div>
    );
  }

  // Assistant message: no bubble, directly on background, full width
  return (
    <div className="flex flex-col">
      <div className="prose prose-gray max-w-none break-words prose-p:my-3 prose-p:leading-relaxed prose-strong:font-semibold prose-ul:my-3 prose-li:my-1 prose-headings:mt-4 prose-headings:mb-2">
        <Markdown>{message.content}</Markdown>
      </div>
      <div className="text-xs text-gray-400 mt-3">
        Powered by {message.modelName || "AI"}
      </div>
    </div>
  );
}
