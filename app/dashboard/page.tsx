export const metadata = {
  title: "Dashboard • cr0ss.org",
  description: "Personal data dashboard (coffee, rituals, sleep vs focus, running).",
};

export default async function DashboardPage() {
  // Leave empty for now; we’ll plug charts/data after APIs & schema are in place.
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Data coming soon: coffee, rituals, sleep vs. focus, running goals.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Reserve grid cells for future charts/cards */}
        <div className="rounded-lg border border-neutral-800 p-6">Placeholder</div>
        <div className="rounded-lg border border-neutral-800 p-6">Placeholder</div>
        <div className="rounded-lg border border-neutral-800 p-6">Placeholder</div>
      </div>
    </main>
  );
}