'use client';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useRef } from "react";


// const objectLoaded = () => console.log("Object is loaded");
// const imageLoaded = () => console.log("Image is loaded");


export default function Home() {
  const objectRef = useRef<HTMLObjectElement>(null);
  // const imageRef = useRef<HTMLImageElement>(null);

  useEffect(
    () => {
      const objElement = objectRef.current;
      // const imageElement = imageRef.current;

      if (objElement) {
        console.log("objElement", objElement);
        const svgDocument = objElement.getSVGDocument();
        const countries = ["DE", "AT", "IT", "ES", "FR", "PT", "IT-SA", "HR", "FI", "EN", "EG", "TH", "US", "LU", "BE", "NL", "PL", "FR-GP", "MT", "MT-GZ", "GR"];
        countries.forEach((country) => {
          svgDocument?.getElementById(country)?.setAttribute("fill", "gray");
        });
      }

      // if (imageElement) {
      //   console.log("imageElement", imageElement);
      //   imageElement.addEventListener("load", imageLoaded);
      //   return () => {
      //     imageElement.removeEventListener("load", imageLoaded);
      //   };
      // } 
    }, 
    []
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:size-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="https://cr0ss.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            By{" cr0ss"}
          </a>
        </div>
      </div>

      <div className="relative z-[-1] flex place-items-center before:absolute before:h-[300px] before:w-full before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 sm:before:w-[480px] sm:after:w-[240px] before:lg:h-[360px]">
        <object 
          ref={objectRef}
          // onLoad={objectLoaded}
          className="map"
          type="image/svg+xml"
          data="world.svg"
        >
          <Image
            className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
            src="/world.svg"
            // ref={imageRef}
            // onLoad={imageLoaded}
            alt="Map"
            width={800}
            height={600}
            priority
          />
        </object>

        

      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left">
        <a
          href="https://github.com/kayoslab"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
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
        </a>

        <a
          href="./clp9jga130ft2qe0001sv5vq0.pdf"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
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
        </a>

        <a
          href="https://www.linkedin.com/in/cr0ss/"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
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
        </a>

        <a
          href="https://instagram.com/cr0ss.mind"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
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
        </a>
      </div>
    </main>
  );
}
