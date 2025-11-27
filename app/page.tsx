import Image from "next/image";
import { FeaturedPosts } from '@/components/home/featured-posts';

export default async function HomeContent() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'>
        <div className="w-full max-w-7xl mx-auto px-4">
            <Image
              src="/home-image.jpeg"
              alt="Avatar"
              className="mx-auto mt-6"
              width={1200}
              height={1200}
              priority
              fetchPriority="high"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
            />
            <blockquote className="border-l-4 border-gray-300 pl-4 my-6 italic text-gray-700">
                Not everything that you can see is real, not everything that is real can be seen.
            </blockquote>

            <FeaturedPosts />
        </div>
    </main>
  );
}
