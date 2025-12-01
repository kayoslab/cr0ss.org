# Product Requirements Document: Correlation Discovery Engine

**Version:** 1.0
**Date:** 2025-01-30
**Owner:** Product Manager Agent
**Status:** Ready for Implementation

---

## 📋 Executive Summary

Build an automated correlation discovery system that analyzes quantified self data to surface meaningful relationships between habits, activities, and outcomes. The system will help discover patterns like "outdoor time correlates with writing productivity" or "caffeine timing affects sleep quality."

### Goals
- Automatically discover correlations across all tracked metrics
- Present insights in an actionable, visually appealing format
- Enhance data collection with environmental and subjective metrics
- Improve dashboard UX with shadcn/ui multi-pane layout

### Success Metrics
- Discover at least 3 statistically significant correlations (p < 0.05)
- Daily engagement with subjective metrics logging (>80% completion rate)
- Dashboard load time improvement (target: <2s for initial pane)
- User satisfaction with insight actionability

---

## 🎯 User Stories

### Primary User: Simon (Site Owner)

**As a quantified-self enthusiast, I want to:**
1. Automatically discover correlations between my habits without manual analysis
2. See confidence levels for each correlation to know which insights are reliable
3. View detailed scatter plots and statistical evidence for discovered patterns
4. Track how correlations change over time as I gather more data
5. Log subjective metrics (mood, energy, stress) quickly each day
6. Understand the statistical methodology behind each insight

**As a data-driven optimizer, I want to:**
1. Test hypotheses by viewing specific variable relationships
2. Export correlation data for further analysis
3. Filter insights by timeframe (last 30/90/365 days)
4. See weather context alongside my habit data

**As a blog author, I want to:**
1. Discover interesting patterns worth writing about
2. Generate visualizations to include in blog posts
3. Explain methodology to readers via info tooltips

---

## 🏗️ Technical Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
├─────────────────────────────────────────────────────────────┤
│  shadcn/ui Dashboard → Multi-pane layout                    │
│  ├─ Overview Pane (existing aggregated view)                │
│  ├─ Insights Pane (NEW - correlation cards)                 │
│  ├─ Coffee & Caffeine Pane                                  │
│  ├─ Running & Workouts Pane                                 │
│  ├─ Habits & Productivity Pane                              │
│  └─ Settings Pane                                           │
├─────────────────────────────────────────────────────────────┤
│                     API Layer                               │
├─────────────────────────────────────────────────────────────┤
│  /api/insights/correlations → Correlation engine            │
│  /api/insights/details/[id] → Detailed analysis             │
│  /api/metrics/subjective → Log mood/energy/stress           │
│  /api/location/history → Location + weather storage         │
│  /api/weather/current → OpenWeatherMap integration          │
├─────────────────────────────────────────────────────────────┤
│                     Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL (Neon)                                          │
│  ├─ days (existing)                                         │
│  ├─ rituals (existing)                                      │
│  ├─ coffee_log (existing)                                   │
│  ├─ runs (existing)                                         │
│  ├─ workouts (existing)                                     │
│  ├─ location_history (NEW)                                  │
│  ├─ subjective_metrics (NEW)                                │
│  └─ correlations_cache (NEW - optional Phase 2)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Phase 1: Foundation (Weeks 1-2)

### 1.1 Database Migrations

**New Table: `location_history`**
```sql
CREATE TABLE location_history (
  id BIGSERIAL PRIMARY KEY,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,

  -- Weather data from OpenWeatherMap
  temp_celsius NUMERIC(5, 2),
  feels_like_celsius NUMERIC(5, 2),
  humidity INTEGER CHECK (humidity BETWEEN 0 AND 100),
  weather_main VARCHAR(50), -- 'Clear', 'Clouds', 'Rain', etc.
  weather_description TEXT,
  wind_speed_mps NUMERIC(5, 2),
  cloudiness INTEGER CHECK (cloudiness BETWEEN 0 AND 100),

  -- Optional: store raw API response for future use
  weather_raw JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_location_history_date ON location_history(DATE(logged_at));
CREATE INDEX idx_location_history_logged_at ON location_history(logged_at DESC);
```

**New Table: `subjective_metrics`**
```sql
CREATE TABLE subjective_metrics (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,

  -- 1-10 scales
  mood INTEGER CHECK (mood BETWEEN 1 AND 10),
  energy INTEGER CHECK (energy BETWEEN 1 AND 10),
  stress INTEGER CHECK (stress BETWEEN 1 AND 10),
  focus_quality INTEGER CHECK (focus_quality BETWEEN 1 AND 10),

  -- Optional notes
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_subjective_metrics_updated
BEFORE UPDATE ON subjective_metrics
FOR EACH ROW EXECUTE FUNCTION set_timestamp();
```

**Migration: Extend `days` table**
```sql
-- Add step tracking to days table (if not already there)
ALTER TABLE days ADD COLUMN IF NOT EXISTS steps INTEGER DEFAULT 0 CHECK (steps >= 0);
ALTER TABLE days ADD COLUMN IF NOT EXISTS reading_minutes INTEGER DEFAULT 0 CHECK (reading_minutes >= 0);
ALTER TABLE days ADD COLUMN IF NOT EXISTS outdoor_minutes INTEGER DEFAULT 0 CHECK (outdoor_minutes >= 0);
ALTER TABLE days ADD COLUMN IF NOT EXISTS writing_minutes INTEGER DEFAULT 0 CHECK (writing_minutes >= 0);
ALTER TABLE days ADD COLUMN IF NOT EXISTS coding_minutes INTEGER DEFAULT 0 CHECK (coding_minutes >= 0);
```

### 1.2 OpenWeatherMap Integration

**Environment Variables:**
```env
OPENWEATHER_API_KEY=6996199716009c4646b0c0e706dac44d
```

**New File: `lib/weather/openweathermap.ts`**
```typescript
interface WeatherData {
  temp_celsius: number;
  feels_like_celsius: number;
  humidity: number;
  weather_main: string;
  weather_description: string;
  wind_speed_mps: number;
  cloudiness: number;
  weather_raw: Record<string, unknown>;
}

export async function fetchWeatherData(
  lat: number,
  lon: number
): Promise<WeatherData> {
  // Implementation to call OpenWeatherMap API
  // https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric
}
```

**Update: `app/api/location/route.ts`**
- When location is posted, also fetch and store weather data
- Insert into `location_history` table with weather information

### 1.3 shadcn/ui Integration

**Install shadcn/ui:**
```bash
npx shadcn@latest init
npx shadcn@latest add sidebar
npx shadcn@latest add card
npx shadcn@latest add tabs
npx shadcn@latest add badge
npx shadcn@latest add tooltip
npx shadcn@latest add separator
```

**New Dashboard Structure:**
- Create `app/dashboard/layout.tsx` with sidebar navigation
- Split existing dashboard into panes:
  - `app/dashboard/page.tsx` - Overview
  - `app/dashboard/insights/page.tsx` - Correlations (NEW)
  - `app/dashboard/coffee/page.tsx` - Coffee & Caffeine
  - `app/dashboard/activity/page.tsx` - Running & Workouts
  - `app/dashboard/habits/page.tsx` - Daily Habits
  - `app/dashboard/settings/page.tsx` - Settings (existing)

---

## 📊 Phase 2: Correlation Engine Backend (Weeks 2-3)

### 2.1 Statistical Analysis Module

**New File: `lib/stats/correlation.ts`**

```typescript
interface CorrelationResult {
  variable1: string;
  variable2: string;
  correlation: number; // Pearson's r
  pValue: number;
  sampleSize: number;
  confidenceLevel: 'strong' | 'moderate' | 'exploratory';
  effect: 'positive' | 'negative' | 'none';
  strength: 'strong' | 'moderate' | 'weak' | 'none';
}

interface VariableData {
  date: string;
  value: number;
}

/**
 * Calculate Pearson correlation coefficient
 */
export function calculatePearsonCorrelation(
  x: number[],
  y: number[]
): number;

/**
 * Calculate p-value for correlation
 */
export function calculatePValue(
  r: number,
  n: number
): number;

/**
 * Classify confidence level based on p-value and sample size
 */
export function classifyConfidence(
  pValue: number,
  sampleSize: number
): 'strong' | 'moderate' | 'exploratory';

/**
 * Find all correlations between variables
 */
export async function discoverCorrelations(
  variables: Map<string, VariableData[]>,
  options: {
    minSampleSize?: number; // default: 14
    maxPValue?: number; // default: 0.1
    minCorrelation?: number; // default: 0.3
  }
): Promise<CorrelationResult[]>;
```

### 2.2 Data Aggregation

**New File: `lib/insights/data-aggregator.ts`**

```typescript
interface DailyMetrics {
  date: string;

  // Existing metrics
  sleep_score?: number;
  steps?: number;
  reading_minutes?: number;
  outdoor_minutes?: number;
  writing_minutes?: number;
  coding_minutes?: number;
  focus_minutes?: number;

  // Coffee metrics (aggregated for day)
  total_caffeine_mg?: number;
  coffee_cups?: number;
  last_coffee_hour?: number; // hour of day (0-23)

  // Running metrics
  running_distance_km?: number;
  running_pace_sec_per_km?: number;

  // Workout metrics
  workout_duration_min?: number;
  workout_intensity?: string;

  // Weather metrics
  avg_temp_celsius?: number;
  weather_main?: string;

  // Subjective metrics
  mood?: number;
  energy?: number;
  stress?: number;
  focus_quality?: number;
}

/**
 * Aggregate all data sources into daily metrics
 */
export async function aggregateDailyMetrics(
  startDate: string,
  endDate: string
): Promise<DailyMetrics[]>;

/**
 * Convert daily metrics to variable arrays for correlation analysis
 */
export function extractVariables(
  metrics: DailyMetrics[]
): Map<string, VariableData[]>;
```

### 2.3 API Endpoints

**New File: `app/api/insights/correlations/route.ts`**

```typescript
export async function GET(req: Request) {
  // 1. Parse query parameters (days_back, min_correlation, etc.)
  // 2. Aggregate daily metrics
  // 3. Extract variables
  // 4. Run correlation analysis
  // 5. Sort by absolute correlation strength
  // 6. Return top N correlations
}
```

**Example Response:**
```json
{
  "correlations": [
    {
      "id": "outdoor_writing",
      "variable1": "outdoor_minutes",
      "variable2": "writing_minutes",
      "correlation": 0.67,
      "pValue": 0.003,
      "sampleSize": 87,
      "confidenceLevel": "strong",
      "effect": "positive",
      "strength": "moderate",
      "insight": "When outdoor time exceeds 60 mins, writing output increases by 45% on average",
      "metadata": {
        "v1_mean": 72.5,
        "v2_mean": 125.3,
        "v1_std": 34.2,
        "v2_std": 67.8
      }
    }
  ],
  "metadata": {
    "daysAnalyzed": 87,
    "totalCorrelationsFound": 12,
    "generatedAt": "2025-01-30T10:00:00Z"
  }
}
```

**New File: `app/api/insights/details/[id]/route.ts`**
- Return detailed scatter plot data for specific correlation
- Include regression line data
- Provide daily breakdown

---

## 🎨 Phase 3: Insights Dashboard UI (Weeks 3-4)

### 3.1 Insight Cards Component

**New File: `components/insights/correlation-card.tsx`**

```tsx
interface CorrelationCardProps {
  correlation: CorrelationResult;
  onViewDetails: () => void;
}

export function CorrelationCard({ correlation, onViewDetails }: CorrelationCardProps) {
  // Renders:
  // - Header with confidence badge
  // - Variable names with icons
  // - Correlation strength visualization
  // - Plain-language insight
  // - "View Details" button
  // - Info tooltip explaining statistics
}
```

**Features:**
- Color-coded by confidence (green=strong, yellow=moderate, blue=exploratory)
- Star rating for effect strength (★★★ for strong, ★★ for moderate, ★ for weak)
- Hover tooltips with statistical details
- Responsive card layout

### 3.2 Insights Dashboard Page

**New File: `app/dashboard/insights/page.tsx`**

```tsx
export default async function InsightsPage() {
  // Fetch correlations from API
  // Group by confidence level
  // Display in card grid
  // Include filters (timeframe, variables, confidence)
  // Empty state for insufficient data
}
```

**Sections:**
- **Strong Evidence** (p < 0.01, n > 30) - Top insights
- **Moderate Evidence** (p < 0.05, n > 20)
- **Exploratory** (p < 0.1, n > 14) - Promising patterns

### 3.3 Detail Modal/Page

**New File: `components/insights/correlation-detail-modal.tsx`**

```tsx
export function CorrelationDetailModal({ correlationId }: { correlationId: string }) {
  // Fetch detailed data
  // Render scatter plot with trend line
  // Show statistical breakdown
  // Display methodology explanation
  // Include data table
}
```

**Components:**
- Recharts scatter plot with regression line
- Statistical summary table (r, r², p-value, n, CI)
- Methodology accordion explaining Pearson's r
- Export to CSV button

---

## 📝 Phase 4: Subjective Metrics Input (Weeks 4-5)

### 4.1 Quick Log Component

**New File: `components/metrics/subjective-metrics-form.tsx`**

```tsx
export function SubjectiveMetricsForm({ date }: { date: string }) {
  // Simple 1-10 sliders for:
  // - Mood 😊
  // - Energy ⚡
  // - Stress 😰
  // - Focus Quality 🎯
  // Optional notes textarea
  // Save button
}
```

**UX Requirements:**
- Pre-fill with previous day's values (if exist)
- Visual feedback with emoji scale (1=😢, 10=😄)
- Keyboard shortcuts for quick entry
- Auto-save draft to prevent data loss
- Mobile-optimized (large touch targets)

### 4.2 Daily Prompt

**Options:**
- Dashboard banner: "Log today's metrics"
- Quick-log modal accessible from nav
- Optional: Daily reminder (browser notification)

### 4.3 API Endpoint

**New File: `app/api/metrics/subjective/route.ts`**

```typescript
// POST - Create/update subjective metrics for date
export async function POST(req: Request) {
  // Validate input (Zod schema)
  // Upsert into subjective_metrics table
  // Return success/error
}

// GET - Fetch subjective metrics for date range
export async function GET(req: Request) {
  // Parse date range
  // Query database
  // Return metrics
}
```

---

## 🧪 Phase 5: Testing & Refinement (Weeks 5-6)

### 5.1 Statistical Validation

**Test Cases:**
- Known correlations (caffeine vs sleep)
- No correlation scenarios
- Edge cases (insufficient data, perfect correlation)
- P-value calculation accuracy
- Confidence level classification

### 5.2 UI/UX Testing

**Focus Areas:**
- Dashboard load time (lazy loading panes)
- Mobile responsiveness
- Accessibility (ARIA labels, keyboard navigation)
- Empty states (no data, no correlations)
- Error handling (API failures, invalid input)

### 5.3 Data Quality

**Validation:**
- Weather API error handling
- Missing data interpolation strategy
- Outlier detection
- Data completeness requirements

---

## 📐 Design Specifications

### Color Palette for Confidence Levels

- **Strong (p < 0.01)**: Green (#10b981)
- **Moderate (p < 0.05)**: Yellow (#f59e0b)
- **Exploratory (p < 0.1)**: Blue (#3b82f6)

### Typography

- Card headers: `font-semibold text-lg`
- Statistics: `font-mono text-sm` (for precision)
- Insights: `text-base text-gray-700`

### Icons

- Use Heroicons for consistency
- Variable types: ChartBarIcon, HeartIcon, CoffeeIcon, etc.
- Info tooltips: InformationCircleIcon

---

## 🔐 Security & Privacy

### API Security
- All insight endpoints require authentication (X-Secret header)
- Rate limiting: 30 req/min for correlation endpoint
- Input validation with Zod schemas

### Data Privacy
- All correlation data is private (no public sharing in MVP)
- OpenWeatherMap API key stored in env vars
- No PII in logs

---

## 🚀 Deployment Strategy

### Migrations
1. Run database migrations on production
2. Backfill location_history with current location (if exists)
3. Add OpenWeatherMap API key to Vercel env vars

### Feature Flags
- Optional: Use env var `ENABLE_INSIGHTS_DASHBOARD=true` for gradual rollout

### Rollback Plan
- Database migrations are additive (non-breaking)
- New tables can be dropped if needed
- Old dashboard still works if insights disabled

---

## 📚 Documentation Requirements

### Code Documentation
- JSDoc comments for all statistical functions
- Explain methodology in correlation.ts
- API endpoint documentation (OpenAPI/Swagger)

### User Documentation
- Info tooltips on every card explaining statistics
- Methodology page (optional blog post)
- Help text for subjective metrics

### Developer Documentation
- Update README with new features
- Architecture decision record (ADR) for statistical choices
- Database schema updates

---

## 🎯 Success Criteria

### Functional Requirements
✅ Discover correlations automatically
✅ Display insights with confidence levels
✅ Allow filtering and drilling down
✅ Log subjective metrics daily
✅ Store location + weather history
✅ Integrate shadcn/ui dashboard

### Performance Requirements
✅ Dashboard initial load < 2s
✅ Correlation calculation < 5s for 365 days
✅ API response time < 1s (90th percentile)
✅ Mobile-optimized (responsive design)

### Quality Requirements
✅ 100% test coverage for statistical functions
✅ Accessibility (WCAG 2.1 AA)
✅ Type-safe (TypeScript strict mode)
✅ Error handling (graceful degradation)

---

## 🗓️ Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Phase 1: Foundation | Weeks 1-2 | DB migrations, OpenWeatherMap, shadcn/ui setup |
| Phase 2: Backend | Weeks 2-3 | Correlation engine, API endpoints |
| Phase 3: UI | Weeks 3-4 | Insights dashboard, cards, detail views |
| Phase 4: Metrics | Weeks 4-5 | Subjective metrics input, daily logging |
| Phase 5: Polish | Weeks 5-6 | Testing, refinement, documentation |

**Total Estimated Time:** 5-6 weeks

---

## 🤝 Agent Coordination Plan

### Architecture Agent
- Database schema design
- API endpoint architecture
- Statistical calculation implementation
- OpenWeatherMap integration
- Performance optimization

### UX Agent
- shadcn/ui component selection
- Dashboard layout design
- Insight card design
- Subjective metrics form UX
- Mobile responsiveness
- Accessibility compliance

### Frontend Agent
- Component implementation
- API integration
- State management
- Data visualization (scatter plots)
- Form handling
- Loading/error states

---

## 📞 Open Questions & Decisions Needed

1. **Weather Frequency**: How often to log weather? (Every location update, daily at noon, on-demand?)
   - **Decision**: Log weather whenever location is updated + daily at 12:00 PM UTC if no update that day

2. **Correlation Caching**: Pre-compute overnight or calculate on-demand?
   - **Decision**: Calculate on-demand for MVP, add caching in Phase 5 if needed

3. **Subjective Metrics Reminder**: Browser notification, email, or just dashboard prompt?
   - **Decision**: Dashboard banner only for MVP

4. **Historical Weather**: Backfill past dates or only future?
   - **Decision**: Future only (too complex to backfill accurately)

5. **Correlation Threshold**: Minimum r value to display?
   - **Decision**: |r| > 0.3 for exploratory, > 0.5 for moderate, > 0.7 for strong

---

## 🎬 Next Steps

1. **Architecture Agent**: Begin database migration design
2. **UX Agent**: Propose shadcn/ui dashboard layout mockups
3. **Frontend Agent**: Prepare component structure plan
4. **Product Manager**: Review and approve agent proposals
5. **All Agents**: Coordinate on implementation priorities

---

**Document Status:** ✅ Ready for Implementation
**Last Updated:** 2025-01-30
**Approval Required:** Architecture, UX, Frontend Agents
