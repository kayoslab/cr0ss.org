import Map from '@/components/map';
import { kv } from "@vercel/kv";
import { getDashboardData } from "@/lib/cache/dashboard";
import Section from "@/components/dashboard/Section";
import { Kpi } from "@/components/dashboard/Kpi";
import { Donut, Line, Area, Scatter, Bars, Progress } from "@/components/dashboard/charts/TremorCharts";
import { GOALS } from "@/lib/db/constants";
import { getAllCountries, getVisitedCountries } from '@/lib/contentful/api/country';
import { CountryProps } from '@/lib/contentful/api/props/country';
import { Panel } from '@/components/dashboard/charts/TremorCharts';

export const dynamic = "force-dynamic";
export const fetchCache = 'force-no-store';
// export const metadata = {
//   title: "Dashboard • cr0ss.org",
//   description: "Coffee, rituals, sleep vs focus, running.",
// };

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


export default async function HomeContent() {
    const locationKey = 'GEOLOCATION';
    const storedLocation = await kv.get<{ lat: number; lon: number }>(locationKey);
    const data = await getDashboardData();

    // ---------- Country Data ----------
    const countries = await getAllCountries();
    const visitedCountries = await getVisitedCountries(true);

    // ---------- Morning Brew ----------
    const methodsBar = data.brewMethodsToday.map(b => ({ name: b.type, value: b.count }));
    const tastingDonut = data.tastingThisWeek.map(t => ({ name: t.tasting, value: t.count }));
    const caffeineLine = data.caffeineCurve.map(p => ({hour: `${String(p.hour).padStart(2, "0")}:00`, mg: p.mg}));

    // ---------- Daily Rituals ----------
    const progressToday = [
        {
            name: "Steps",
            value: data.habitsToday.steps,
            target: GOALS.steps 
        }, {
            name: "Reading",
            value: data.habitsToday.reading_minutes,
            target: GOALS.minutesRead
        }, {
            name: "Outdoor",
            value: data.habitsToday.outdoor_minutes,
            target: GOALS.minutesOutdoors
        }, {
            name: "Writing",
            value: data.habitsToday.writing_minutes,
            target: GOALS.writingMinutes
        },  {
            name: "Coding",
            value: data.habitsToday.coding_minutes,
            target: GOALS.codingMinutes
        }, {
            name: "Journaling",
            value: data.habitsToday.journaled ? 1 : 0,
            target: 1
        },
    ];
    
    const consistencyBars = data.habitsConsistency.map(r => ({
        name: r.name, 
        value: Math.round((r.kept / Math.max(1, r.total)) * 100)
    })); // show % kept
    const rhythmTrend = data.writingVsFocus.map(d => ({ 
        date: d.date, 
        writing: d.writing_minutes, 
        "Focus (min)": d.focus_minutes 
    }));

    // ---------- Focus & Flow ----------
    const scatter = data.sleepVsFocus.map(d => ({ date: d.date, sleep: d.sleep_score, focus: d.focus_minutes }));
    const blocksArea = data.deepWorkBlocks.map(d => ({ date: d.date, blocks: d.blocks }));

    // ---------- Running & Movement ---------- 
    const pace = data.paceSeries.map(p => ({
        date: p.date,
        "Pace (min/km)": +(p.pace_sec_per_km/60).toFixed(2),
    }));


    return (
        <main className="items-center justify-between min-h-screen">
            <div className="relative z-[-1] flex justify-center place-items-center before:absolute before:h-[300px] before:w-full before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] dark:before:bg-linear-to-br dark:before:from-transparent dark:before:to-blue-700 dark:before:opacity-10 dark:after:from-sky-900 dark:after:via-[#0141ff] dark:after:opacity-40 sm:before:w-[480px] sm:after:w-[240px] lg:before:h-[360px] pb-24 py-24">
                <Map lat={storedLocation?.lat ?? 0} lon={storedLocation?.lon ?? 0} />
            </div>
            <div className="mx-auto max-w-7xl px-6 py-10 space-y-10">
                {/* 1) Morning Brew */}
                <Section title="1. Travel">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Kpi label="Visited Countries" value={visitedCountries?.length ?? 0} />
                    {/* <Bars title="" items={(visitedCountries?.map((country: CountryProps) => ({ name: country.name, value: 1 })) ?? []).slice(0, 5)} /> */}
                    <Panel title={'Last Visited'}>
                        {(visitedCountries ?? []).slice(0, 5).map((country: CountryProps) => (
                            <div key={country.id} className="text-m">{country.name} ({country.id})</div>
                        ))}
                    </Panel>
                    <Donut title="Countries" data={[{ name: 'Visited', value: visitedCountries?.length ?? 0 }, { name: 'Not Visited', value: (countries?.length ?? 0) - (visitedCountries?.length ?? 0) }]} />
                </div>
                </Section>
                
                {/* 2) Morning Brew */}
                <Section title="2. Morning Brew">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Kpi label="Cups Today" value={data.cupsToday} />
                    <Bars title="Brew methods today" items={methodsBar} />
                    <Donut title="Tasting notes (7d)" data={tastingDonut} />
                </div>
                <div className="mt-4">
                    <Line title="Caffeine curve (today)" data={caffeineLine} index="hour" categories={["mg"]} type="monotone" />
                </div>
                </Section>
        
                {/* 3) Daily Rituals */}
                <Section title="3. Daily Rituals">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {progressToday.map((p) => (
                    <Progress title={`${p.name} Goal Progress`} key={p.name} value={p.value} target={p.target} />
                    ))}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Bars title="Rituals consistency" items={consistencyBars} />
                    <div className="md:col-span-2">
                    <Area title="Writing vs Focus" data={rhythmTrend} index="date" categories={["Writing","Focus (min)"]} />
                    </div>
                </div>
                </Section>
        
                {/* 4) Focus & Flow */}
                <Section title="4. Focus & Flow">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                    <Scatter title="Sleep vs Focus" data={scatter} x="Sleep" y="Focus" />
                    </div>
                    <Kpi label="Focus Streak (≥ target)" value={`${data.focusStreak.days} days`} />
                </div>
                <div className="mt-4">
                    <Area title="Deep Work Blocks" data={blocksArea} index="date" categories={["Blocks"]} />
                </div>
                </Section>
        
                {/* 4) Running & Movement */}
                <Section title="4. Running & Movement">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Kpi label="This Month (km)" value={data.runningProgress.total_km.toFixed(1)} />
                    <Kpi label="Goal (km)" value={data.runningProgress.target_km.toFixed(1)} />
                    <Kpi label="Delta (km)" value={data.runningProgress.delta_km.toFixed(1)} />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Progress title="Running Progress" value={data.runningProgress.total_km} target={data.runningProgress.target_km} />
                    <div className="md:col-span-2">
                    <Line title="Pace (min/km)" data={pace} index="date" categories={["Pace (min/km)"]} />
                    </div>
                </div>
                <div className="mt-4">
                    <h3 className="mb-2 text-sm font-medium text-neutral-400">Activity Heatmap (last 6 weeks)</h3>
                    <Heatmap days={data.movementHeat} />
                </div>
                </Section>
            </div>
            <div className="space-y-16"></div>
        </main>
    );
}
