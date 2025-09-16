import { unstable_cache } from "next/cache";
import {
  qCupsToday, qBrewMethodsToday, qTastingThisWeek, qCaffeineCurveToday,
  qHabitsToday, qHabitConsistencyThisWeek, qWritingVsFocusTrend,
  qSleepVsFocusScatter, qDeepWorkBlocksThisWeek, qFocusStreak,
  qRunningMonthlyProgress, qPaceLastRuns, qRunningHeatmap,
} from "@/lib/db/queries";
import { GOALS } from "@/lib/db/constants";

export const getDashboardData = unstable_cache(async () => {
    const [
        cupsToday,
        brewMethodsToday,
        tastingThisWeek,
        caffeineCurve,

        habitsToday,
        habitsConsistency,
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

        qHabitsToday(),
        qHabitConsistencyThisWeek(),
        qWritingVsFocusTrend(14),

        qSleepVsFocusScatter(30),
        qDeepWorkBlocksThisWeek(),
        qFocusStreak(GOALS.focusMinutes),

        qRunningMonthlyProgress(),
        qPaceLastRuns(10),
        qRunningHeatmap(42),
    ]);

    return {
        cupsToday,
        brewMethodsToday,
        tastingThisWeek,
        caffeineCurve,
        habitsToday,
        habitsConsistency,
        writingVsFocus,
        sleepVsFocus,
        deepWorkBlocks,
        focusStreak,
        runningProgress,
        paceSeries,
        movementHeat,
    };
    },
    ["dashboard"],
    { tags: ["dashboard"] }
);
