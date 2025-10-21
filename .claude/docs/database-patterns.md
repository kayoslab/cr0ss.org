# Database Patterns

## Overview

This project uses Neon PostgreSQL with a focus on type-safety, parameterized queries, and proper validation. This document outlines our database patterns and conventions.

## Core Principles

1. **Parameterized Queries** - Always use template literals, never string interpolation
2. **Zod Validation** - Validate all database responses
3. **Migration-Based Schema Changes** - All schema changes via numbered migrations
4. **JSONB for Flexibility** - Use JSONB for type-specific or extensible data

## Directory Structure

```
db/
├── migrations/           # Sequential numbered SQL migrations
│   ├── 001_initial.sql
│   ├── 002_add_feature.sql
│   └── ...
lib/db/
├── client.tsx           # Database connection
├── validation.tsx       # Zod schemas for database entities
├── queries.tsx          # Read-only queries
├── profile.tsx          # Body profile queries
├── workouts.tsx         # Workout-related queries
└── models.tsx           # Zod schemas for query results
```

## Migration Patterns

### File Naming

```
db/migrations/XXX_descriptive_name.sql
```

- **XXX**: Zero-padded 3-digit number (001, 002, ..., 099, 100, ...)
- **descriptive_name**: Snake_case description of the change

### Migration Structure

```sql
-- Migration: Brief description of what this does
-- Date: YYYY-MM-DD

-- Step 1: Create new structures
CREATE TABLE new_table (...);

-- Step 2: Migrate existing data (if applicable)
INSERT INTO new_table SELECT ... FROM old_table;

-- Step 3: Drop old structures (if applicable)
DROP TABLE old_table;

-- Step 4: Add indexes
CREATE INDEX idx_table_column ON table(column);

-- Step 5: Add comments
COMMENT ON TABLE new_table IS 'Description of table purpose';
COMMENT ON COLUMN new_table.column IS 'Description of column';
```

### Example Migration

```sql
-- Add workout tracking with flexible schema
-- Date: 2025-01-20

-- Step 1: Create workouts table
CREATE TABLE workouts (
  id                serial PRIMARY KEY,
  date              date NOT NULL,
  workout_type      varchar(20) NOT NULL CHECK (workout_type IN (
    'running', 'climbing', 'bouldering', 'rowing', 'cycling', 'hiking', 'strength', 'other'
  )),
  duration_min      integer NOT NULL CHECK (duration_min > 0),
  intensity         varchar(10) CHECK (intensity IN ('low', 'moderate', 'high', 'max')),
  perceived_effort  integer CHECK (perceived_effort >= 1 AND perceived_effort <= 10),
  details           jsonb,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Step 2: Create indexes
CREATE INDEX idx_workouts_date ON workouts(date DESC);
CREATE INDEX idx_workouts_type ON workouts(workout_type);
CREATE INDEX idx_workouts_date_type ON workouts(date DESC, workout_type);

-- Step 3: Add comments
COMMENT ON TABLE workouts IS 'Unified table for all workout/activity types with flexible schema';
COMMENT ON COLUMN workouts.details IS 'Activity-specific metrics in JSON format';
```

## Query Patterns

### Standard Query Function

```typescript
// lib/db/entity.tsx
import { neon } from "@neondatabase/serverless";
import { ZEntityRow } from "@/lib/db/validation";

const sql = neon(process.env.DATABASE_URL!);

/**
 * Get entity by ID
 */
export async function getEntityDB(id: number) {
  const rows = await sql/*sql*/`
    SELECT
      id,
      name,
      created_at
    FROM entities
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!rows[0]) {
    throw new Error(`Entity with id ${id} not found`);
  }

  const r = rows[0];
  const out = {
    id: Number(r.id),
    name: String(r.name),
    created_at: new Date(r.created_at).toISOString(),
  };

  return ZEntityRow.parse(out);
}
```

### Insert/Update Pattern

```typescript
export async function insertEntityDB(data: EntityInput) {
  const parsed = ZEntityInput.parse(data);

  const rows = await sql/*sql*/`
    INSERT INTO entities (
      name,
      description
    ) VALUES (
      ${parsed.name},
      ${parsed.description ?? null}::text
    )
    RETURNING
      id,
      name,
      description,
      created_at
  `;

  const r = rows[0];
  const out = {
    id: Number(r.id),
    name: String(r.name),
    description: r.description ? String(r.description) : null,
    created_at: new Date(r.created_at).toISOString(),
  };

  return ZEntityRow.parse(out);
}
```

### Query with JSONB

```typescript
// Extract from JSONB field
export async function getWorkoutsWithDistanceDB(minKm: number) {
  const rows = await sql/*sql*/`
    SELECT
      id,
      date,
      workout_type,
      details
    FROM workouts
    WHERE details ? 'distance_km'
      AND (details->>'distance_km')::numeric >= ${minKm}
    ORDER BY date DESC
  `;

  return rows.map(r => ({
    id: Number(r.id),
    date: new Date(r.date),
    workout_type: r.workout_type,
    details: r.details,
  }));
}
```

## Validation Schemas

### Pattern: One File Per Entity

```typescript
// lib/db/validation.tsx
import { z } from "zod";

// Database row schema (as returned from DB)
export const ZEntityRow = z.object({
  id: z.number().int(),
  name: z.string(),
  created_at: z.string(), // ISO string
});

// Input schema (for INSERT/UPDATE)
export const ZEntityInput = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

// Type exports
export type EntityRow = z.infer<typeof ZEntityRow>;
export type EntityInput = z.infer<typeof ZEntityInput>;
```

### JSONB Schema Documentation

When using JSONB fields, document expected schemas in column comments:

```sql
COMMENT ON COLUMN workouts.details IS 'Activity-specific metrics in JSON format. Common schemas by type:

Running: {
  "distance_km": 10.5,
  "elevation_gain_m": 150,
  "avg_pace_sec_per_km": 300,
  "avg_heart_rate": 150
}

Climbing: {
  "grade": "6b+",
  "pitches": 5,
  "style": "lead",
  "location": "Frankenjura",
  "indoor": false
}';
```

## Type Coercion Patterns

### Numeric Fields

```typescript
// Neon returns numeric as strings, coerce to numbers
const out = {
  weight_kg: Number(r.weight_kg),
  distance_km: r.distance_km === null ? undefined : Number(r.distance_km),
};
```

### Date Fields

```typescript
// Always convert to ISO strings for consistency
const out = {
  date: new Date(r.date),  // For Date objects
  created_at: new Date(r.created_at).toISOString(),  // For timestamps
};
```

### Nullable Fields

```typescript
// Use null coalescence for optional fields
const out = {
  optional_field: r.optional_field === null ? undefined : String(r.optional_field),
};
```

## JSONB Usage Guidelines

### When to Use JSONB

✅ **Good use cases**:
- Activity-specific metrics that vary by type (workouts)
- Extensible metadata that doesn't need indexing
- Schema-flexible data (configuration, settings)
- Array of structured data (exercise lists)

❌ **Avoid JSONB for**:
- Frequently queried/filtered fields → Use regular columns
- Foreign key relationships → Use proper relations
- Simple boolean flags → Use boolean columns
- Data that needs strong type constraints → Use enums/check constraints

### JSONB Query Patterns

```typescript
// Check if key exists
WHERE details ? 'distance_km'

// Extract as text
SELECT details->>'distance_km' as distance

// Extract as number
WHERE (details->>'distance_km')::numeric > 10

// Extract nested
SELECT details->'user'->>'name' as user_name

// Update JSONB field
UPDATE workouts
SET details = details || '{"new_key": "value"}'::jsonb
WHERE id = ${id}

// Build JSONB in INSERT
jsonb_build_object('key1', value1, 'key2', value2)
```

## Historical Data Pattern

### Pattern: INSERT-only with Timestamps

For data that should be tracked over time (measurements, logs):

```typescript
// ❌ Bad: UPDATE pattern (loses history)
export async function updateBodyWeightDB(weight_kg: number) {
  await sql/*sql*/`
    UPDATE body_profile
    SET weight_kg = ${weight_kg}
    WHERE id = 1
  `;
}

// ✅ Good: INSERT pattern (preserves history)
export async function insertBodyMeasurementDB(data: MeasurementInput) {
  const measuredAt = data.measured_at ? new Date(data.measured_at) : new Date();

  await sql/*sql*/`
    INSERT INTO body_profile (
      measured_at,
      weight_kg,
      created_at
    ) VALUES (
      ${measuredAt},
      ${data.weight_kg},
      now()
    )
  `;
}

// Get current (most recent)
export async function getCurrentBodyProfileDB() {
  const rows = await sql/*sql*/`
    SELECT * FROM body_profile
    ORDER BY measured_at DESC
    LIMIT 1
  `;
  return rows[0];
}

// Get history
export async function getBodyProfileHistoryDB(limit: number = 30) {
  const rows = await sql/*sql*/`
    SELECT * FROM body_profile
    ORDER BY measured_at DESC
    LIMIT ${limit}
  `;
  return rows;
}
```

## Error Handling

### Query Errors

```typescript
export async function getEntityDB(id: number) {
  try {
    const rows = await sql/*sql*/`
      SELECT * FROM entities WHERE id = ${id}
    `;

    if (!rows[0]) {
      throw new Error(`Entity ${id} not found`);
    }

    return ZEntityRow.parse(rows[0]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw error;  // Re-throw for handling in API layer
    }
    console.error('Database query failed:', error);
    throw new Error('Failed to fetch entity');
  }
}
```

## Anti-Patterns

### ❌ Avoid

```typescript
// ❌ String interpolation (SQL injection!)
const query = `SELECT * FROM users WHERE email='${email}'`;
await sql.unsafe(query);

// ❌ No validation
export async function getUser(id: number) {
  const { rows } = await sql/*sql*/`SELECT * FROM users WHERE id = ${id}`;
  return rows[0];  // Unvalidated!
}

// ❌ Returning raw database objects
export async function getUsers() {
  const { rows } = await sql/*sql*/`SELECT * FROM users`;
  return rows;  // No type safety!
}

// ❌ Using JSONB for frequently-queried fields
CREATE TABLE users (
  id serial PRIMARY KEY,
  data jsonb  -- ❌ Don't store email, name in JSONB if you query them!
);

// ❌ Overusing JSONB instead of proper normalization
CREATE TABLE orders (
  id serial PRIMARY KEY,
  customer jsonb,  -- ❌ Should be customer_id FK
  items jsonb      -- ❌ Should be order_items table
);
```

### ✅ Good Patterns

```typescript
// ✅ Parameterized query
const rows = await sql/*sql*/`
  SELECT * FROM users WHERE email = ${email}
`;

// ✅ Validated response
export async function getUser(id: number): Promise<User> {
  const rows = await sql/*sql*/`SELECT * FROM users WHERE id = ${id}`;
  if (!rows[0]) throw new Error('User not found');
  return ZUser.parse(rows[0]);
}

// ✅ Type-safe with transformation
export async function getUsers(): Promise<User[]> {
  const rows = await sql/*sql*/`SELECT * FROM users`;
  return rows.map(r => ZUser.parse(r));
}

// ✅ JSONB for appropriate use case
CREATE TABLE workouts (
  id serial PRIMARY KEY,
  workout_type varchar(20) NOT NULL,  -- Regular column (frequently filtered)
  duration_min integer NOT NULL,      -- Regular column (frequently queried)
  details jsonb                       -- JSONB (workout-specific metrics)
);
```

## Testing Database Changes

### Before Committing

```bash
# 1. Apply migration locally
psql $DATABASE_URL < db/migrations/XXX_new_migration.sql

# 2. Test queries
psql $DATABASE_URL
> SELECT * FROM new_table LIMIT 5;

# 3. Verify TypeScript compiles
npx tsc --noEmit

# 4. Test API endpoints
curl -X POST http://localhost:3000/api/endpoint \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: $SECRET" \
  -d '{"test":"data"}'
```

## Checklist for New Database Queries

- [ ] Uses parameterized queries (template literals)
- [ ] Validates responses with Zod schema
- [ ] Proper type coercion (Number, String, Date)
- [ ] Error handling with meaningful messages
- [ ] Documented in TSDoc comments
- [ ] Returns typed values (no `any`)
- [ ] Tested with actual data
- [ ] Migration file numbered correctly
- [ ] JSONB usage justified (if applicable)
- [ ] Indexes added for filtered/sorted columns
