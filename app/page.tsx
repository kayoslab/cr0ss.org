import Link from "next/link";
import Image from "next/image";

export default async function HomeContent() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'>
        <div>
            <Image src="/home-image.jpeg" alt="Avatar" className="mx-auto mt-6" width={1200} height={1200} priority />
            <blockquote className="border-l-4 border-gray-300 pl-4 my-6 italic text-gray-700">
                Not everything that you can see is real, not everything that is real can be seen.
            </blockquote>
        </div>
        <div className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left pb-24">
            <Link
            href="https://github.com/kayoslab"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100:border-neutral-700:bg-neutral-800/30"
            target="_blank"
            rel="noopener noreferrer"
            >
            <h2 className="mb-3 text-2xl font-semibold">
                Code
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
                </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
                See some of my contributions on GitHub.
            </p>
            </Link>

            <Link
            href="./cv.pdf"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100:border-neutral-700:bg-neutral-800/30"
            target="_blank"
            rel="noopener noreferrer"
            >
            <h2 className="mb-3 text-2xl font-semibold">
                Work
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
                </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
                Are you looking for a professional? Check out my experience.
            </p>
            </Link>

            <Link
            href="https://www.linkedin.com/in/cr0ss/"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100:border-neutral-700:bg-neutral-800/30"
            target="_blank"
            rel="noopener noreferrer"
            >
            <h2 className="mb-3 text-2xl font-semibold">
                Connect
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
                </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
                Connect with me on LinkedIn to work together.
            </p>
            </Link>

            <Link
            href="https://instagram.com/cr0ss.mind"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100:border-neutral-700:bg-neutral-800/30"
            target="_blank"
            rel="noopener noreferrer"
            >
            <h2 className="mb-3 text-2xl font-semibold">
                Follow
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
                </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-balance text-sm opacity-50">
                See what I am up to and follow me on Instagram.
            </p>
            </Link>
        </div>
    </main>
  );
}
