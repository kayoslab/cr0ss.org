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
    <main className='flex min-h-screen flex-col items-center bg-white pb-24'>
      <section className='w-full pt-12 max-w-(--breakpoint-lg)'>
        <div className='container mx-auto px-4 md:px-6'>
          <ChatInterface />
        </div>
      </section>
    </main>
  );
}
