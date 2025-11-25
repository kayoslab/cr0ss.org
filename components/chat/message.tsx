import Link from "next/link";
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

  const hasSources = message.sources && message.sources.length > 0;

  // Assistant message: no bubble, directly on background, full width
  return (
    <div className="flex flex-col">
      <div className="prose prose-gray max-w-none break-words prose-p:my-3 prose-p:leading-relaxed prose-strong:font-semibold prose-ul:my-3 prose-li:my-1 prose-headings:mt-4 prose-headings:mb-2">
        <Markdown
          components={{
            p: ({ children }) => <p className="my-3 leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="my-3">{children}</ul>,
            ol: ({ children }) => <ol className="my-3">{children}</ol>,
            li: ({ children }) => <li className="my-1">{children}</li>,
          }}
        >
          {message.content}
        </Markdown>
      </div>

      {hasSources && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Related blog posts:</p>
          <div className="flex flex-wrap gap-2">
            {message.sources!.map((source, idx) => (
              <Link
                key={idx}
                href={source.url.replace("https://cr0ss.org", "")}
                className="inline-flex items-center text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              >
                {source.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400 mt-3">
        Powered by {message.modelName || "AI"}
      </div>
    </div>
  );
}
