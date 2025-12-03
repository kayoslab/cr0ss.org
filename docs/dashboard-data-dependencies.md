# Dashboard Data Dependencies Analysis

## Overview Page (`/dashboard`)
**Data Used:**
- `cupsToday` - Coffee cups today
- `habitsToday.steps` - Steps today
- `habitsToday.reading_minutes` - Reading minutes today
- `workoutHeatmap[last].duration_min` - Active minutes today
- `runningProgress.{total_km, target_km}` - Running progress
- `monthlyGoals.*` - All monthly goals
- Travel data (from Contentful, not dashboard data)
- Location data (separate query)

**Not Used:** caffeineSeries, brewMethodsToday, coffeeOriginThisWeek, workoutStats, etc.

## Coffee Page (`/dashboard/coffee`)
**Data Used:**
- `cupsToday` - Cups consumed today
- `brewMethodsToday` - Brew methods with counts
- `coffeeOriginThisWeek` - Coffee origins (7 days)
- `caffeineSeries` - Caffeine timeline data
- `coffeeLast30Days` - Last 30 days coffee data

**Not Used:** habits, workouts, running data

## Travel Page (`/dashboard/travel`)
**Data Used:**
- **NONE from getDashboardData()**
- All data from Contentful (countries, visited)
- Location data (separate query)

**Not Used:** Everything from getDashboardData()

## Workouts Page (`/dashboard/workouts`)
**Data Used:**
- `workoutTypes` - Types of workouts present
- `workoutStats` - Stats by type
- `workoutHeatmap` - 60-day heatmap
- `workoutStreaks.{current, longest}` - Streak data
- `runningPersonalRecords.{longestRun, fastestPace}` - PRs

**Not Used:** coffee, habits (except workouts), caffeine data

## Habits Page (`/dashboard/habits`)
**Data Used:**
- `monthlyGoals.*` - All monthly goals
- `habitsToday.*` - All today's habits
- `habitsConsistency` - Weekly consistency
- `habitStreaks` - Habit streaks
- `writingVsFocus` - 14-day trend
- `sleepPrevCaff` - Sleep vs caffeine scatter

**Not Used:** workout stats, coffee origins, brew methods

---

## Shared Data (Multiple Pages)
- `monthlyGoals` - Used by Overview, Habits
- `habitsToday` - Used by Overview, Habits
- `runningProgress` - Used by Overview (implicitly via workouts)
- `workoutHeatmap` - Used by Overview, Workouts

---

## Optimization Strategy

### Shared Data Module
Create `lib/db/dashboard/shared.ts` for data used by multiple pages:
- `getMonthlyGoals()` - cached separately
- `getHabitsToday()` - cached separately

### Domain-Specific Modules

1. **`lib/db/dashboard/overview.ts`**
   - Lightweight, cherry-picks from other domains
   - Imports from coffee, habits, workouts modules

2. **`lib/db/dashboard/coffee.ts`**
   - Coffee-specific data only
   - Tag: `CACHE_TAGS.COFFEE`

3. **`lib/db/dashboard/travel.ts`**
   - Currently doesn't use getDashboardData() at all!
   - No changes needed

4. **`lib/db/dashboard/workouts.ts`**
   - Workout + running data
   - Tag: `CACHE_TAGS.WORKOUTS`

5. **`lib/db/dashboard/habits.ts`**
   - Habits, productivity, sleep data
   - Tag: `CACHE_TAGS.HABITS`

---

## Cache Tag Strategy

```typescript
export const CACHE_TAGS = {
  DASHBOARD: 'dashboard',        // Keep for overview page
  COFFEE: 'coffee',               // Coffee-specific
  HABITS: 'habits',               // Habits-specific
  WORKOUTS: 'workouts',           // Workouts-specific
  SHARED: 'dashboard-shared',     // Shared data (goals, today)
}
```

## Cache Invalidation Strategy

**POST Endpoints:**
- `/api/habits/coffee` → Invalidate `COFFEE` + `SHARED`
- `/api/habits/day` → Invalidate `HABITS` + `SHARED`
- `/api/habits/workout` → Invalidate `WORKOUTS` + `SHARED`
- `/api/habits/run` → Invalidate `WORKOUTS` + `SHARED`
- `/api/habits/goal` → Invalidate `SHARED`
- `/api/habits/body` → Invalidate `COFFEE` (caffeine model depends on body)

---

## Expected Performance Improvement

**Current (Phase 1):**
- Cache MISS: 300-600ms (all 18 queries)
- Cache HIT: <50ms

**Phase 2:**
- Coffee page cache MISS: ~100ms (5 queries instead of 18)
- Workouts page cache MISS: ~150ms (8 queries instead of 18)
- Habits page cache MISS: ~200ms (10 queries instead of 18)
- Overview page cache MISS: ~250ms (uses multiple cached modules)
- Travel page: No change (doesn't use getDashboardData())

**Total improvement:** 2-3x faster on cache MISS
