import { CountryProps } from '@/lib/contentful/api/props/country';
import { getAllCountries } from '@/lib/contentful/api/country';

export default async function Home() {
  const countries = await getAllCountries();
    
  // const mapLoaded = () => {
  //   const svgDocument = objectRef.current?.getSVGDocument();
  //   if (svgDocument) {
  //     const center = computeCentroid(polygons("DE", svgDocument));
  //     svgDocument.getElementById("GEO")?.setAttribute("transform", "translate(" + center[0] + ", " + center[1] + ")");
  //     svgDocument.getElementById("GEO")?.setAttribute("fill", "blue");
  //     svgDocument.getElementById("GEO")?.setAttribute("stroke", "white");
  //     svgDocument.getElementById("GEO")?.setAttribute("stroke-width", "1");

  //     visitedCountries.forEach((country: CountryProps) => {
  //       svgDocument.getElementById(country.id)?.setAttribute("fill", "gray");
  //     });
  //   }
  // };

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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          id="world"
          width="1009.6727"
          height="665.96301"
          fill="#ececec"
          stroke="#666666" 
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth=".1"
        >
          { 
            countries?.map(
              (country: CountryProps) => (
                <path
                  id={country.id}
                  key={country.id}
                  d={country.path}
                  fill={ country.visited ? "gray" : "#ececec" }
                />
              )
            ) 
          }
          <circle cx="3.75" cy="3.75" r="3.75" fill="blue" id="GEO" name="Location" />
        </svg>
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
