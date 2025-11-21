import ChatInterface from '@/components/chat/chat-interface';
import { createListMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = createListMetadata({
  title: 'Chat with AI | cr0ss.mind',
  description: 'Chat with an AI assistant that knows about Simon Krüger\'s professional background, expertise, and blog posts.',
  path: '/chat',
});

export default function ChatPage() {
  return (
    <main className='flex flex-col bg-white pb-24'>
      <div className="flex flex-col max-w-3xl w-full mx-auto px-4">
        <ChatInterface />
      </div>
    </main>
  );
}
