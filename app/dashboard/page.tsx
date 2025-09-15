import Section from "@/components/dashboard/Section";
import { Kpi } from "@/components/dashboard/Kpi";
import { Donut, Line, Area, Scatter, Bars, Progress } from "@/components/dashboard/charts/TremorCharts";
import {
  qBrewMethodsToday, qCupsToday, qTastingThisWeek, qCaffeineCurveToday,
  qRitualsToday, qRitualConsistencyThisWeek, qWritingVsFocusTrend,
  qSleepVsFocusScatter, qDeepWorkBlocksThisWeek, qFocusStreak,
  qRunningMonthlyProgress, qPaceLastRuns, qRunningHeatmap
} from "@/lib/db/queries";
import { GOALS } from "@/lib/db/constants";

// Simple heatmap for movement (tailwind CSS grid)
function Heatmap({ days }:{ days: { date: string; km: number }[] }) {
  const max = Math.max(1, ...days.map(d=> d.km));
  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map(({ date, km }, i) => {
        const intensity = km === 0 ? 0 : Math.max(0.2, km/max); // 0 -> gray; else scale
        const bg = km === 0 ? "bg-neutral-800" : "bg-green-500";
        const style = km === 0 ? {} : { opacity: intensity };
        return (
          <div key={date+"-"+i} className={`h-4 w-4 rounded-sm ${bg}`} title={`${date}: ${km.toFixed(2)} km`} style={style} />
        );
      })}
    </div>
  );
}

export const metadata = {
  title: "Dashboard • cr0ss.org",
  description: "Coffee, rituals, sleep vs focus, running.",
};

export default async function DashboardPage() {
  // Parallelize all reads
  const [
    cupsToday,
    brewMethodsToday,
    tastingThisWeek,
    caffeineCurve,

    ritualsToday,
    ritualsConsistency,
    writingVsFocus,

    sleepVsFocus,
    deepWorkBlocks,
    focusStreak,

    runningProgress,
    paceSeries,
    movementHeat,
  ] = await Promise.all([
    qCupsToday(),
    qBrewMethodsToday(),
    qTastingThisWeek(),
    qCaffeineCurveToday(),

    qRitualsToday(),
    qRitualConsistencyThisWeek(),
    qWritingVsFocusTrend(14),

    qSleepVsFocusScatter(30),
    qDeepWorkBlocksThisWeek(),
    qFocusStreak(GOALS.focusMinutes),

    qRunningMonthlyProgress(),
    qPaceLastRuns(10),
    qRunningHeatmap(42),
  ]);

  // ---------- Morning Brew
  const methodsBar = brewMethodsToday.map(b => ({ name: b.type, value: b.count }));
  const tastingDonut = tastingThisWeek.map(t => ({ name: t.tasting, value: t.count }));
  const caffeineLine = caffeineCurve.map(p => ({ hour: `${p.hour}:00`, mg: p.mg }));

  // ---------- Daily Rituals
  const progressToday = [
    { name: "Steps", value: ritualsToday.steps, target: GOALS.steps },
    { name: "Reading", value: ritualsToday.reading_minutes, target: GOALS.readingMinutes },
    { name: "Outdoors", value: ritualsToday.outdoor_minutes, target: GOALS.outdoorMinutes },
    { name: "Journaling", value: ritualsToday.journaled ? 1 : 0, target: 1 },
  ];
  const consistencyBars = ritualsConsistency.map(r => ({
    name: r.name, value: Math.round((r.kept / Math.max(1, r.total)) * 100)
  })); // show % kept
  const rhythmTrend = writingVsFocus.map(d => ({ date: d.date, Writing: d.writing_minutes, "Focus (min)": d.focus_minutes }));

  // ---------- Focus & Flow
  const scatter = sleepVsFocus.map(d => ({ date: d.date, Sleep: d.sleep_score, Focus: d.focus_minutes }));
  const blocksArea = deepWorkBlocks.map(d => ({ date: d.date, Blocks: d.blocks }));

  // ---------- Running & Movement
  const pace = paceSeries.map(p => ({
    date: p.date,
    "Pace (min/km)": +(p.pace_sec_per_km/60).toFixed(2),
  }));

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 space-y-10">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>

      {/* 1) Morning Brew */}
      <Section title="1. Morning Brew ☕">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Kpi label="Cups Today" value={cupsToday} />
          <Bars title="Brew methods today" items={methodsBar} />
          <Donut title="Tasting notes (7d)" data={tastingDonut} />
        </div>
        <div className="mt-4">
          <Line title="Caffeine curve (today)" data={caffeineLine} index="hour" categories={["mg"]} />
        </div>
      </Section>

      {/* 2) Daily Rituals */}
      <Section title="2. Daily Rituals ⏰">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {progressToday.map((p) => (
            <Progress title="Rituals Progress" key={p.name} value={p.value} target={p.target} />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Bars title="Rituals consistency" items={consistencyBars} />
          <div className="md:col-span-2">
            <Area title="Writing vs Focus" data={rhythmTrend} index="date" categories={["Writing","Focus (min)"]} />
          </div>
        </div>
      </Section>

      {/* 3) Focus & Flow */}
      <Section title="3. Focus & Flow 💻">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <Scatter title="Sleep vs Focus" data={scatter} x="Sleep" y="Focus" category="date" />
          </div>
          <Kpi label="Focus Streak (≥ target)" value={`${focusStreak.days} days`} />
        </div>
        <div className="mt-4">
          <Area title="Deep Work Blocks" data={blocksArea} index="date" categories={["Blocks"]} />
        </div>
      </Section>

      {/* 4) Running & Movement */}
      <Section title="4. Running & Movement 🏃‍♂️">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Kpi label="This Month (km)" value={runningProgress.total_km.toFixed(1)} />
          <Kpi label="Goal (km)" value={runningProgress.target_km.toFixed(1)} />
          <Kpi label="Delta (km)" value={runningProgress.delta_km.toFixed(1)} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Progress title="Running Progress" value={runningProgress.total_km} target={runningProgress.target_km} />
          <div className="md:col-span-2">
            <Line title="Pace (min/km)" data={pace} index="date" categories={["Pace (min/km)"]} />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium text-neutral-400">Activity Heatmap (last 6 weeks)</h3>
          <Heatmap days={movementHeat} />
        </div>
      </Section>
    </main>
  );
}