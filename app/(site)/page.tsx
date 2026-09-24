import Image from 'next/image';
import homeImage from '@/public/home-image.jpeg';
import { FeaturedPosts } from '@/components/home/featured-posts';

export default async function HomeContent() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'>
      <div className='mx-auto w-full max-w-7xl px-4'>
        {/* Static import: content-hashed, immutable URL plus a blur placeholder.
            The image renders at its 1086px intrinsic width once the viewport
            (minus the 16px gutters) can hold it. */}
        <Image
          src={homeImage}
          alt='Avatar'
          className='mx-auto mt-6'
          placeholder='blur'
          priority
          fetchPriority='high'
          sizes='(max-width: 1118px) 100vw, 1086px'
        />
        <blockquote className='my-6 border-l-4 border-gray-300 pl-4 text-gray-700 italic'>
          Not everything that you can see is real, not everything that is real
          can be seen.
        </blockquote>

        <FeaturedPosts />
      </div>
    </main>
  );
}
