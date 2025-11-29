import { unstable_cache } from "next/cache";
import {
  qCupsToday, qBrewMethodsToday, qCoffeeOriginThisWeek,
  qHabitsToday, qHabitConsistencyThisWeek, qWritingVsFocusTrend,
  qSleepVsFocusScatter, qDeepWorkBlocksThisWeek, qFocusStreak,
  qRunningMonthlyProgress, qPaceLastRuns, qRunningHeatmap,
} from "@/lib/db/queries";

export const getDashboardData = unstable_cache(async () => {
    const [
        cupsToday,
        brewMethodsToday,
        coffeeOriginThisWeek,

        habitsToday,
        habitsConsistency,
        writingVsFocus,

        sleepVsFocus,
        deepWorkBlocks,
        focusStreak,

        runningProgress,
        paceSeries,
        runningHeatmap,
    ] = await Promise.all([
        qCupsToday(),
        qBrewMethodsToday(),
        qCoffeeOriginThisWeek(),

        qHabitsToday(),
        qHabitConsistencyThisWeek(),
        qWritingVsFocusTrend(14),

        qSleepVsFocusScatter(30),
        qDeepWorkBlocksThisWeek(),
        qFocusStreak(),

        qRunningMonthlyProgress(),
        qPaceLastRuns(10),
        qRunningHeatmap(42),
    ]);

    return {
        cupsToday,
        brewMethodsToday,
        coffeeOriginThisWeek,
        habitsToday,
        habitsConsistency,
        writingVsFocus,
        sleepVsFocus,
        deepWorkBlocks,
        focusStreak,
        runningProgress,
        paceSeries,
        runningHeatmap,
    };
    },
    ["dashboard"],
    { tags: ["dashboard"] }
);
