import DashboardSkeleton from "./dashboard.skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <DashboardSkeleton />
      </section>
    </main>
  );
}
