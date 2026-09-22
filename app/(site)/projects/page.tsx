import { permanentRedirect } from 'next/navigation';

// Projects moved to the Contentful-backed /portfolio route.
export default function ProjectsPage() {
  permanentRedirect('/portfolio');
}
