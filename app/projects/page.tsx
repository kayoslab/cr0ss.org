import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Projects | cr0ss.mind",
  description: "Projects by cr0ss",
};

type Project = {
  name: string;
  description: string;
  url: string;
  external?: boolean;
};

const projects: Project[] = [
  {
    name: "Signal Intelligence",
    description:
      "In Progress: Signal Intelligence is a browser-based self-audit that reveals what a device and browser expose before a user logs into any website.",
    url: "https://signal.cr0ss.org",
    external: true,
  },
  {
    name: "404 Museum",
    description:
      "Every page refresh reveals a fake abandoned website from an alternate internet timeline. Each generated website feels like something that genuinely could have existed.",
    url: "https://404.cr0ss.org",
    external: true,
  },
  {
    name: "Latency Cathedral",
    description:
      "Uses live network timings (ping, resource load, packet jitter) to generate gothic structures in WebGL. Every network condition creates a different cathedral.",
    url: "https://latency.cr0ss.org",
    external: true,
  },
  {
    name: "EAVI",
    description:
      "An ephemeral audiovisual installation in the browser. Each visit becomes a one-off composition shaped by your environment, time and motion — then disappears, leaving no trace.",
    url: "https://eavi.cr0ss.org",
    external: true,
  },
  {
    name: "Migration Readiness Assessment",
    description:
      "A diagnostic framework for engineering leaders and CTOs to evaluate whether their organisation is ready for platform modernisation. It collects structured feedback from engineering, product, business, and leadership stakeholders, then surfaces misalignments across six readiness domains using statistical validation and NLP-driven qualitative analysis.",
    url: "https://github.com/kayoslab/Migration-Readiness-Assessment",
    external: true,
  },
  {
    name: "Dashboard",
    description:
      "A quantified-self dashboard that tracks daily habits, coffee and caffeine metabolism, workouts, running stats, and travel across countries — with an insights engine that discovers statistical correlations between metrics.",
    url: "/dashboard",
  },
  {
    name: "Coffee",
    description:
      "A curated journal of specialty coffees documenting origin, roaster, processing method, variety, tasting notes, SCA scores, and brewing recipes — each with an interactive map pinpointing where the beans were grown.",
    url: "/coffee",
  },
];

export default function ProjectsPage() {
  return (
    <main className="flex flex-col items-center bg-white pb-12">
      <div className="w-full max-w-4xl px-6 pt-10 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Projects
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Things I&apos;ve been building.
        </p>

        <div className="mt-8 grid gap-6">
          {projects.map((project) =>
            project.external ? (
              <a
                key={project.name}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-xl border border-gray-200 p-6 transition-colors hover:border-gray-400 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {project.name}
                  </h2>
                  <ArrowUpRight className="h-5 w-5 text-gray-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gray-600" />
                </div>
                <p className="mt-2 text-gray-600">{project.description}</p>
              </a>
            ) : (
              <Link
                key={project.name}
                href={project.url}
                className="group block rounded-xl border border-gray-200 p-6 transition-colors hover:border-gray-400 hover:bg-gray-50"
              >
                <h2 className="text-xl font-semibold text-gray-900">
                  {project.name}
                </h2>
                <p className="mt-2 text-gray-600">{project.description}</p>
              </Link>
            )
          )}
        </div>
      </div>
    </main>
  );
}
