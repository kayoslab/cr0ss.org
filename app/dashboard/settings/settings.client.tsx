"use client";

import { SECRET_HEADER } from "@/lib/auth/constants";
import React, { useEffect, useMemo, useState } from "react";

/* --------------------------------------------------------
   small helpers
--------------------------------------------------------- */

const cls = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

async function jfetch<T>(
  url: string,
  opts: RequestInit,
  secret?: string
): Promise<{ ok: boolean; status: number; json: T | null; error?: string }> {
  const headers = new Headers(opts.headers as HeadersInit | undefined);
  if (!headers.has("content-type")) headers.set("content-type", "application/json");
  if (secret) headers.set(SECRET_HEADER, secret);
  const res = await fetch(url, { ...opts, headers, cache: "no-store" });
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // ignore
  }
  return {
    ok: res.ok,
    status: res.status,
    json,
    error: (!res.ok && (json?.error || json?.message || res.statusText)) || undefined,
  };
}

function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cls(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent align-[-0.125em]",
        className
      )}
      aria-label="loading"
    />
  );
}

/* --------------------------------------------------------
   Keyboard helpers (submit with ⌘/Ctrl+Enter, Esc to blur,
   ↑/↓ to step numbers, ⇧ = ×10)
--------------------------------------------------------- */

function makeFormHotkeys(onSubmit: () => void) {
  return (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      // blur to commit any active field then submit
      (document.activeElement as HTMLElement | null)?.blur();
      onSubmit();
    } else if (e.key === "Escape") {
      (e.target as HTMLElement).blur();
    }
  };
}

function mkNumberKeydownHandler(opts: { onSubmit?: () => void; step?: number } = {}) {
  const baseStep = opts.step ?? 1;
  return (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Submit: Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      (document.activeElement as HTMLElement | null)?.blur();
      opts.onSubmit?.();
      return;
    }
    // Escape: blur
    if (e.key === "Escape") {
      (e.currentTarget as HTMLInputElement).blur();
      return;
    }
    // Arrow up/down: increment/decrement value
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const dir = e.key === "ArrowUp" ? 1 : -1;
      const step = e.shiftKey ? baseStep * 10 : baseStep;
      const current = Number((e.currentTarget.value || "0").replace(",", "."));
      const next = current + dir * step;
      e.preventDefault();
      const t = e.currentTarget;
      t.value = String(next);
      // Fire an input event so React updates controlled state
      const ev = new Event("input", { bubbles: true });
      t.dispatchEvent(ev as any);
    }
  };
}

/* --------------------------------------------------------
   types (aligned with your APIs)
--------------------------------------------------------- */

type BodyProfile = {
  weight_kg: number;
  height_cm?: number | null;
  vd_l_per_kg?: number | null;
  half_life_hours?: number | null;
  caffeine_sensitivity?: number | null;
  bioavailability?: number | null;
};

type Goals = {
  running_distance_km: number;
  steps: number;
  reading_minutes: number;
  outdoor_minutes: number;
  writing_minutes: number;
  coding_minutes: number;
  focus_minutes: number;
};

type DayPayload = {
  date: string; // YYYY-MM-DD
  sleep_score: number;
  focus_minutes: number;
  steps: number;
  reading_minutes: number;
  outdoor_minutes: number;
  writing_minutes: number;
  coding_minutes: number;
};

type CoffeeBrewingMethod = "espresso" | "v60" | "chemex" | "moka" | "aero" | "cold_brew" | "other";

type CoffeeLogPayload = {
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  type: CoffeeBrewingMethod;
  amount_ml?: number;
  coffee_cf_id?: string | null; // "0" for None (treated as no link)
};

type RunPayload = {
  date: string; // YYYY-MM-DD
  distance_km: number;
  duration_min: number;
  avg_pace_sec_per_km?: number;
};

type CoffeeRow = { id: string; name: string; roaster: string };

/* --------------------------------------------------------
   defaults
--------------------------------------------------------- */

const methodDefaults: Record<CoffeeBrewingMethod, number> = {
  espresso: 38,
  v60: 250,
  chemex: 300,
  moka: 60,
  aero: 200,
  cold_brew: 250,
  other: 200,
};

const emptyGoals: Goals = {
  running_distance_km: 0,
  steps: 0,
  reading_minutes: 0,
  outdoor_minutes: 0,
  writing_minutes: 0,
  coding_minutes: 0,
  focus_minutes: 0,
};

const emptyDay = (dateStr: string): DayPayload => ({
  date: dateStr,
  sleep_score: 0,
  focus_minutes: 0,
  steps: 0,
  reading_minutes: 0,
  outdoor_minutes: 0,
  writing_minutes: 0,
  coding_minutes: 0,
});

/* --------------------------------------------------------
   main component
--------------------------------------------------------- */

export default function SettingsClient({ coffees }: { coffees: CoffeeRow[] }) {
  // secret gate
  const [secret, setSecret] = useState<string>("");
  const [secretOK, setSecretOK] = useState<boolean>(false);
  const [checking, setChecking] = useState(false);

  // feedback
  const [msg, setMsg] = useState<string | null>(null);

  // per-section saving flags
  const [savingBody, setSavingBody] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [savingDay, setSavingDay] = useState(false);
  const [savingCoffee, setSavingCoffee] = useState(false);
  const [savingRun, setSavingRun] = useState(false);

  // data models
  const [body, setBody] = useState<BodyProfile | null>(null);
  const [goals, setGoals] = useState<Goals>(emptyGoals);
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [day, setDay] = useState<DayPayload>(emptyDay(todayStr));

  // body form (controlled, stringy to preserve cursor)
  const [bodyForm, setBodyForm] = useState({
    weight_kg: "",
    height_cm: "",
    vd_l_per_kg: "",
    half_life_hours: "",
    caffeine_sensitivity: "",
    bioavailability: "",
  });

  // coffee form
  const [coffeeDate, setCoffeeDate] = useState<string>(todayStr);
  const [coffeeTime, setCoffeeTime] = useState<string>(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  });
  const [method, setMethod] = useState<CoffeeBrewingMethod>("espresso");
  const [amount, setAmount] = useState<number>(methodDefaults.espresso);
  const [coffeeId, setCoffeeId] = useState<string>(""); // Contentful ID; "0" when None

  // run form
  const [runDate, setRunDate] = useState<string>(todayStr);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [durationMin, setDurationMin] = useState<number>(0);
  const [paceSec, setPaceSec] = useState<number>(0);

  // load secret from localStorage
  useEffect(() => {
    const s = localStorage.getItem("dashboard_secret");
    if (s) setSecret(s);
  }, []);

  // when method changes, prefill amount
  useEffect(() => setAmount(methodDefaults[method]), [method]);

  // sync body -> bodyForm when loaded or updated
  useEffect(() => {
    if (!body) return;
    setBodyForm({
      weight_kg: body.weight_kg?.toString() ?? "",
      height_cm: body.height_cm?.toString() ?? "",
      vd_l_per_kg: body.vd_l_per_kg?.toString() ?? "",
      half_life_hours: body.half_life_hours?.toString() ?? "",
      caffeine_sensitivity: body.caffeine_sensitivity?.toString() ?? "",
      bioavailability: body.bioavailability?.toString() ?? "",
    });
  }, [body]);

  /* ---------------- secret validation & hydration ---------------- */

  async function handleSaveSecret(e?: React.FormEvent) {
    e?.preventDefault();
    setMsg(null);
    setChecking(true);
    try {
      // Validate by calling a protected route; POST /api/habits/body with {} (no-op)
      const check = await jfetch<{ ok: boolean }>(
        "/api/auth/check",
        { method: "GET" },
        secret
      );
      if (!check.ok) throw new Error(check.error || "Secret invalid");

      // Cache & mark valid
      localStorage.setItem("dashboard_secret", secret);
      setSecretOK(true);

      // Hydrate data models
      const [bodyRes, goalsRes, dayRes] = await Promise.all([
        jfetch<BodyProfile>("/api/habits/body", { method: "GET" }, secret),
        jfetch<Goals>("/api/habits/goal", { method: "GET" }, secret),
        jfetch<DayPayload>(`/api/habits/day?date=${todayStr}`, { method: "GET" }, secret),
      ]);

      if (bodyRes.ok && bodyRes.json) setBody(bodyRes.json);
      if (goalsRes.ok && goalsRes.json) setGoals({ ...emptyGoals, ...(goalsRes.json as any) });
      if (dayRes.ok && dayRes.json) setDay({ ...(dayRes.json as any) });
      else setDay(emptyDay(todayStr));

      setMsg("Secret saved. Data loaded.");
    } catch (e: any) {
      setSecretOK(false);
      setMsg(e?.message || "Could not validate the secret.");
    } finally {
      setChecking(false);
    }
  }

  /* ---------------- submitters ---------------- */

  async function submitBody(e?: React.FormEvent) {
    e?.preventDefault();
    if (!secretOK) return setMsg("Enter a valid secret first.");
    setSavingBody(true);
    try {
      const payload: any = {
        weight_kg: bodyForm.weight_kg,
        height_cm: bodyForm.height_cm,
        vd_l_per_kg: bodyForm.vd_l_per_kg,
        half_life_hours: bodyForm.half_life_hours,
        caffeine_sensitivity: bodyForm.caffeine_sensitivity,
        bioavailability: bodyForm.bioavailability,
      };
      const res = await jfetch<{ ok: boolean; profile?: BodyProfile }>(
        "/api/habits/body",
        { method: "POST", body: JSON.stringify(payload) },
        secret
      );
      if (res.ok && res.json && (res.json as any).profile) {
        const profile = (res.json as any).profile as BodyProfile;
        setBody(profile); // triggers bodyForm sync via useEffect
        setMsg("Body profile saved.");
      } else if (res.ok) {
        const ref = await jfetch<BodyProfile>("/api/habits/body", { method: "GET" }, secret);
        if (ref.ok && ref.json) setBody(ref.json);
        setMsg("Body profile saved.");
      } else {
        setMsg(res.error || "Failed to save body profile.");
      }
    } finally {
      setSavingBody(false);
    }
  }

  async function submitGoals(e?: React.FormEvent) {
    e?.preventDefault();
    if (!secretOK) return setMsg("Enter a valid secret first.");
    setSavingGoals(true);
    try {
      const payload = goals;
      const res = await jfetch("/api/habits/goal", { method: "POST", body: JSON.stringify(payload) }, secret);
      setMsg(res.ok ? "Goals saved." : res.error || "Failed to save goals.");
    } finally {
      setSavingGoals(false);
    }
  }

  async function submitDay(e?: React.FormEvent) {
    e?.preventDefault();
    if (!secretOK) return setMsg("Enter a valid secret first.");
    setSavingDay(true);
    try {
      const numericKeys: (keyof DayPayload)[] = [
        "sleep_score",
        "focus_minutes",
        "steps",
        "reading_minutes",
        "outdoor_minutes",
        "writing_minutes",
        "coding_minutes",
      ];
      const valid = numericKeys.every((k) => Number.isFinite(Number((day as any)[k])));
      if (!valid) {
        setMsg("Day: please enter only numbers for numeric fields.");
        return;
      }
      const res = await jfetch("/api/habits/day", { method: "POST", body: JSON.stringify(day) }, secret);
      if (res.ok) {
        setMsg("Day logged.");
        // Keep form values so they reflect DB state; no reset here
      } else {
        setMsg(res.error || "Failed to log day.");
      }
    } finally {
      setSavingDay(false);
    }
  }

  async function submitCoffee(e?: React.FormEvent) {
    e?.preventDefault();
    if (!secretOK) return setMsg("Enter a valid secret first.");
    setSavingCoffee(true);
    try {
      const payload: CoffeeLogPayload = {
        date: coffeeDate,
        time: coffeeTime,
        type: method,
        amount_ml: Number(amount) || 0,
        coffee_cf_id: coffeeId ? coffeeId : "0", // "None" → "0"
      };
      const res = await jfetch("/api/habits/coffee", { method: "POST", body: JSON.stringify(payload) }, secret);
      if (res.ok) {
        setMsg("Coffee logged.");
        // Optional reset; keep date and method defaults reasonable
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        setCoffeeTime(`${hh}:${mm}`);
        setMethod("espresso");
        setAmount(methodDefaults.espresso);
        setCoffeeId("");
      } else setMsg(res.error || "Failed to log coffee.");
    } finally {
      setSavingCoffee(false);
    }
  }

  async function submitRun(e?: React.FormEvent) {
    e?.preventDefault();
    if (!secretOK) return setMsg("Enter a valid secret first.");
    setSavingRun(true);
    try {
      const payload: RunPayload = {
        date: runDate,
        distance_km: Number(distanceKm) || 0,
        duration_min: Number(durationMin) || 0,
        avg_pace_sec_per_km: Number(paceSec) || undefined,
      };
      const res = await jfetch("/api/habits/run", { method: "POST", body: JSON.stringify(payload) }, secret);
      if (res.ok) {
        setMsg("Run logged.");
        setDistanceKm(0);
        setDurationMin(0);
        setPaceSec(0);
      } else setMsg(res.error || "Failed to log run.");
    } finally {
      setSavingRun(false);
    }
  }

  /* --------------------------------------------------------
     UI bits
  --------------------------------------------------------- */

  function Card({
    title,
    children,
    footer,
  }: {
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
  }) {
    return (
      <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-slate-800 p-4">
        <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">{title}</div>
        {children}
        {footer && <div className="pt-3">{footer}</div>}
      </section>
    );
  }

  // Button helper: keep buttons clickable even while an input is focused
  const blurOnMouseDown = {
    onMouseDown: () => (document.activeElement as HTMLElement | null)?.blur(),
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Dashboard Settings</h1>

      {/* status region for SR announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        {msg || ""}
      </div>

      {/* Secret */}
      <Card
        title="API Secret"
        footer={
          <button
            type="submit"
            form="form-secret"
            disabled={checking || !secret}
            {...blurOnMouseDown}
            className={cls(
              "px-4 py-2 rounded-md",
              "bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
            )}
          >
            {checking && <Spinner className="text-black/80" />}
            {checking ? "Checking…" : "Save & Load"}
          </button>
        }
      >
        <form
          id="form-secret"
          onSubmit={handleSaveSecret}
          onKeyDown={makeFormHotkeys(() => handleSaveSecret())}
          className="flex gap-3 items-end"
        >
          <div className="flex-1">
            <Label>Secret</Label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") (e.currentTarget as HTMLInputElement).blur();
              }}
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-slate-950 px-3 py-2"
              placeholder="x-vercel-revalidation-key"
              autoComplete="off"
            />
          </div>
          <span className={cls("text-sm", secretOK ? "text-emerald-600" : "text-neutral-500")}>
            {secretOK ? "Valid" : "Enter secret to unlock forms"}
          </span>
        </form>
      </Card>

      {/* Body Data */}
      <Card
        title="Body Data"
        footer={
          <button
            type="submit"
            form="form-body"
            {...blurOnMouseDown}
            className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
            disabled={!secretOK || savingBody}
          >
            {savingBody && <Spinner className="text-black/80" />}
            {savingBody ? "Saving…" : "Save Body"}
          </button>
        }
      >
        <form
          id="form-body"
          onSubmit={submitBody}
          onKeyDown={makeFormHotkeys(() => submitBody())}
          className="grid grid-cols-2 gap-4"
        >
          <NumField
            label="Weight (kg)"
            value={Number(bodyForm.weight_kg) || 0}
            onCommit={(v) => setBodyForm((f) => ({ ...f, weight_kg: String(v) }))}
            onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitBody(), step: 0.1 })}
          />
          <NumField
            label="Height (cm)"
            value={Number(bodyForm.height_cm) || 0}
            onCommit={(v) => setBodyForm((f) => ({ ...f, height_cm: String(v) }))}
            onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitBody(), step: 1 })}
          />
          <NumField
            label="Vd (L/kg)"
            value={Number(bodyForm.vd_l_per_kg) || 0}
            onCommit={(v) => setBodyForm((f) => ({ ...f, vd_l_per_kg: String(v) }))}
            onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitBody(), step: 0.1 })}
          />
          <NumField
            label="Half-life (h)"
            value={Number(bodyForm.half_life_hours) || 0}
            onCommit={(v) => setBodyForm((f) => ({ ...f, half_life_hours: String(v) }))}
            onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitBody(), step: 0.1 })}
          />
          <NumField
            label="Sensitivity (×)"
            value={Number(bodyForm.caffeine_sensitivity) || 0}
            onCommit={(v) => setBodyForm((f) => ({ ...f, caffeine_sensitivity: String(v) }))}
            onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitBody(), step: 0.1 })}
          />
          <NumField
            label="Bioavailability (0–1)"
            value={Number(bodyForm.bioavailability) || 0}
            onCommit={(v) => setBodyForm((f) => ({ ...f, bioavailability: String(v) }))}
            onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitBody(), step: 0.05 })}
          />
        </form>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          Forms unlock only after a valid secret. Numbers are validated client-side; server enforces types again.
        </p>
      </Card>

      {/* Goal Data */}
      <Card
        title="Goal Data (this month)"
        footer={
          <button
            type="submit"
            form="form-goals"
            {...blurOnMouseDown}
            className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
            disabled={!secretOK || savingGoals}
          >
            {savingGoals && <Spinner className="text-black/80" />}
            {savingGoals ? "Saving…" : "Save Goals"}
          </button>
        }
      >
        <form
          id="form-goals"
          onSubmit={submitGoals}
          onKeyDown={makeFormHotkeys(() => submitGoals())}
          className="grid grid-cols-2 gap-4"
        >
          <NumField label="Running Distance (km)" value={goals.running_distance_km} onCommit={(v)=>setGoals(g=>({...g, running_distance_km:v}))} onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitGoals(), step: 0.5 })}/>
          <NumField label="Steps" value={goals.steps} onCommit={(v)=>setGoals(g=>({...g, steps:v}))} onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitGoals(), step: 100 })}/>
          <NumField label="Reading (min)" value={goals.reading_minutes} onCommit={(v)=>setGoals(g=>({...g, reading_minutes:v}))} onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitGoals(), step: 5 })}/>
          <NumField label="Outdoors (min)" value={goals.outdoor_minutes} onCommit={(v)=>setGoals(g=>({...g, outdoor_minutes:v}))} onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitGoals(), step: 5 })}/>
          <NumField label="Writing (min)" value={goals.writing_minutes} onCommit={(v)=>setGoals(g=>({...g, writing_minutes:v}))} onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitGoals(), step: 5 })}/>
          <NumField label="Coding (min)" value={goals.coding_minutes} onCommit={(v)=>setGoals(g=>({...g, coding_minutes:v}))} onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitGoals(), step: 5 })}/>
          <NumField label="Focus (min)" value={goals.focus_minutes} onCommit={(v)=>setGoals(g=>({...g, focus_minutes:v}))} onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitGoals(), step: 5 })}/>
        </form>
      </Card>

      {/* Coffee Data (Contentful) */}
      <Card title="Coffee Data (latest 20 from Contentful)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500 dark:text-neutral-400">
                <th className="py-2">ID</th>
                <th className="py-2">Name</th>
                <th className="py-2">Roaster</th>
              </tr>
            </thead>
            <tbody>
              {coffees.length === 0 ? (
                <tr><td colSpan={3} className="py-3 text-neutral-500">No coffee entries found.</td></tr>
              ) : coffees.map(c => (
                <tr key={c.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="py-2 font-mono text-xs">{c.id}</td>
                  <td className="py-2">{c.name}</td>
                  <td className="py-2">{c.roaster}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Log Day */}
      <Card
        title="Log Day"
        footer={
          <button
            type="submit"
            form="form-day"
            {...blurOnMouseDown}
            className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
            disabled={!secretOK || savingDay}
          >
            {savingDay && <Spinner className="text-black/80" />}
            {savingDay ? "Saving…" : "Save Day"}
          </button>
        }
      >
        <form
          id="form-day"
          onSubmit={submitDay}
          onKeyDown={makeFormHotkeys(() => submitDay())}
          className="grid grid-cols-2 gap-4"
        >
          <Field
            label="Date"
            type="date"
            value={day.date}
            onChange={(e)=>setDay(d=>({...d, date:(e.target as HTMLInputElement).value}))}
            onKeyDown={(e)=>{ if (e.key === "Escape") (e.currentTarget as HTMLInputElement).blur(); }}
          />
          <NumField label="Sleep score" value={day.sleep_score} onCommit={(v)=>setDay(d=>({...d, sleep_score:v}))} onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitDay(), step: 1 })}/>
          <NumField label="Focus (min)" value={day.focus_minutes} onCommit={(v)=>setDay(d=>({...d, focus_minutes:v}))} onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitDay(), step: 5 })}/>
          <NumField label="Steps" value={day.steps} onCommit={(v)=>setDay(d=>({...d, steps:v}))} onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitDay(), step: 100 })}/>
          <NumField label="Reading (min)" value={day.reading_minutes} onCommit={(v)=>setDay(d=>({...d, reading_minutes:v}))} onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitDay(), step: 5 })}/>
          <NumField label="Outdoors (min)" value={day.outdoor_minutes} onCommit={(v)=>setDay(d=>({...d, outdoor_minutes:v}))} onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitDay(), step: 5 })}/>
          <NumField label="Writing (min)" value={day.writing_minutes} onCommit={(v)=>setDay(d=>({...d, writing_minutes:v}))} onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitDay(), step: 5 })}/>
          <NumField label="Coding (min)" value={day.coding_minutes} onCommit={(v)=>setDay(d=>({...d, coding_minutes:v}))} onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitDay(), step: 5 })}/>
        </form>
      </Card>

      {/* Log Coffee */}
      <Card
        title="Log Coffee"
        footer={
          <button
            type="submit"
            form="form-coffee"
            {...blurOnMouseDown}
            className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
            disabled={!secretOK || savingCoffee}
          >
            {savingCoffee && <Spinner className="text-black/80" />}
            {savingCoffee ? "Saving…" : "Save Coffee"}
          </button>
        }
      >
        <form
          id="form-coffee"
          onSubmit={submitCoffee}
          onKeyDown={makeFormHotkeys(() => submitCoffee())}
          className="grid grid-cols-2 gap-4"
        >
          <Field
            label="Date"
            type="date"
            value={coffeeDate}
            onChange={(e)=>setCoffeeDate((e.target as HTMLInputElement).value)}
            onKeyDown={(e)=>{ if (e.key === "Escape") (e.currentTarget as HTMLInputElement).blur(); }}
          />
          <TimeField label="Time" value={coffeeTime} onChange={setCoffeeTime} />
          <SelectField label="Method" value={method} onChange={(v)=>setMethod(v as CoffeeBrewingMethod)}>
            <option value="espresso">espresso</option>
            <option value="v60">v60</option>
            <option value="chemex">chemex</option>
            <option value="moka">moka</option>
            <option value="aero">aero</option>
            <option value="cold_brew">cold_brew</option>
            <option value="other">other</option>
          </SelectField>
          <NumField label="Amount (mL)" value={amount} onCommit={setAmount} onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitCoffee(), step: 10 })}/>
          <SelectField label="Coffee (Contentful)" value={coffeeId} onChange={setCoffeeId}>
            <option value="">— select —</option>
            {coffees.map(c => (
              <option key={c.id} value={c.id}>{c.name} — {c.roaster}</option>
            ))}
            <option value="0">None</option>
          </SelectField>
        </form>
      </Card>

      {/* Log Run */}
      <Card
        title="Log Run"
        footer={
          <button
            type="submit"
            form="form-run"
            {...blurOnMouseDown}
            className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
            disabled={!secretOK || savingRun}
          >
            {savingRun && <Spinner className="text-black/80" />}
            {savingRun ? "Saving…" : "Save Run"}
          </button>
        }
      >
        <form
          id="form-run"
          onSubmit={submitRun}
          onKeyDown={makeFormHotkeys(() => submitRun())}
          className="grid grid-cols-2 gap-4"
        >
          <Field
            label="Date"
            type="date"
            value={runDate}
            onChange={(e)=>setRunDate((e.target as HTMLInputElement).value)}
            onKeyDown={(e)=>{ if (e.key === "Escape") (e.currentTarget as HTMLInputElement).blur(); }}
          />
          <NumField label="Distance (km)" value={distanceKm} onCommit={setDistanceKm} onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitRun(), step: 0.5 })}/>
          <NumField label="Duration (min)" value={durationMin} onCommit={setDurationMin} onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitRun(), step: 1 })}/>
          <NumField label="Pace (sec/km)" value={paceSec} onCommit={setPaceSec} onKeyDown={mkNumberKeydownHandler({ onSubmit: () => submitRun(), step: 5 })}/>
        </form>
      </Card>

      {msg && <div className="text-sm text-neutral-600 dark:text-neutral-400">{msg}</div>}
    </div>
  );
}

/* --------------------------------------------------------
   tiny inputs
--------------------------------------------------------- */

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">{children}</label>;
}

/** Generic text input (also used for date fields). */
function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const { label, className, ...rest } = props;
  return (
    <div className="flex flex-col">
      {label && <Label>{label}</Label>}
      <input
        {...rest}
        className={cls(
          "w-full rounded-md border border-neutral-300 dark:border-neutral-700",
          "bg-white dark:bg-slate-950 px-3 py-2",
          className
        )}
      />
    </div>
  );
}

/**
 * Numeric text field with internal string state to avoid focus loss and Safari scroll jumps.
 * Commits numeric value on blur or Enter. Supports ↑/↓ and ⌘/Ctrl+Enter via onKeyDown prop.
 */
function NumField({
  label,
  value,
  onCommit,
  placeholder,
  onKeyDown, // optional: allow parent to wire hotkeys/step
}: {
  label: string;
  value: number;
  onCommit: (v: number) => void;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const [text, setText] = useState<string>(() => (Number.isFinite(value) ? String(value) : ""));

  // keep local text in sync when parent value changes externally
  useEffect(() => {
    const next = Number.isFinite(value) ? String(value) : "";
    setText(next);
  }, [value]);

  const commit = () => {
    const raw = text.replace(",", ".").trim();
    if (raw === "" || raw === "-") {
      onCommit(0);
      return;
    }
    const num = Number(raw);
    onCommit(Number.isFinite(num) ? num : 0);
  };

  return (
    <div className="flex flex-col">
      <Label>{label}</Label>
      <input
        type="text"
        inputMode="decimal"
        pattern="^-?[0-9]*([.,][0-9]+)?$"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          // Enter commits value (don’t submit form yet)
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
            return;
          }
          // Let parent hotkeys handle ↑/↓, Esc, ⌘/Ctrl+Enter etc.
          onKeyDown?.(e);
        }}
        className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-slate-950 px-3 py-2"
      />
    </div>
  );
}

/** Checkbox */
function Bool({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = React.useId();
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-emerald-600"
      />
      <label htmlFor={id} className="text-sm text-neutral-700 dark:text-neutral-300">
        {label}
      </label>
    </div>
  );
}

/** Labeled select that stays under its label with full width. */
function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e)=>{ if (e.key === "Escape") (e.currentTarget as HTMLSelectElement).blur(); }}
        className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-slate-950 px-3 py-2"
      >
        {children}
      </select>
    </div>
  );
}

/** 24h time field (HH:mm) without native pickers.
 * - Always 24h across browsers (Chrome/Safari/iOS)
 * - No page scroll jumps (no native spinner)
 * - Validates & normalizes on blur
 * - ↑/↓ to adjust minutes (⇧ = ±5)
 */
function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;          // expected "HH:mm"
  onChange: (v: string) => void;
}) {
  const [text, setText] = useState<string>(() => normalize(value));

  // keep local text in sync when parent updates externally
  useEffect(() => {
    if (value !== text) setText(normalize(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // allow typing partial values like "1", "12:", "12:3"
  function handleChange(raw: string) {
    // strip non-digits/colon, limit to 5 chars
    const cleaned = raw.replace(/[^\d:]/g, "").slice(0, 5);
    // enforce single colon at pos 2 if present
    const parts = cleaned.split(":");
    let next = cleaned;
    if (parts.length > 2) {
      next = `${parts[0]}:${parts[1]}`;
    }
    setText(next);
  }

  function commit() {
    onChange(normalize(text));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Enter commits but does NOT submit the parent form
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
      return;
    }
    // Escape just blurs (no grey overlay because it's not native)
    if (e.key === "Escape") {
      (e.currentTarget as HTMLInputElement).blur();
      return;
    }
    // ↑/↓ adjust minutes; Shift = ±5
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const step = e.shiftKey ? 5 : 1;
      const dir = e.key === "ArrowUp" ? 1 : -1;
      const { hh, mm } = parseHM(text);
      const total = (hh * 60 + mm + dir * step + 24 * 60) % (24 * 60);
      const nh = Math.floor(total / 60);
      const nm = total % 60;
      const next = `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
      setText(next);
      // also commit to parent so charts/forms see live value
      onChange(next);
    }
  }

  return (
    <div className="flex flex-col">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="^\d{2}:\d{2}$"
          placeholder="HH:mm"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
          className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-slate-950 px-3 py-2 font-mono"
          aria-label={`${label}, 24-hour time, format HH colon mm`}
        />
        <button
          type="button"
          onClick={() => {
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, "0");
            const mm = String(now.getMinutes()).padStart(2, "0");
            const curr = `${hh}:${mm}`;
            setText(curr);
            onChange(curr);
          }}
          className="whitespace-nowrap rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-slate-800"
        >
          Now
        </button>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function parseHM(v: string): { hh: number; mm: number } {
  const m = /^(\d{1,2})(?::?(\d{1,2}))?$/.exec(v.trim());
  if (!m) return { hh: 0, mm: 0 };
  const hh = clampInt(parseInt(m[1] || "0", 10), 0, 23);
  const mm = clampInt(parseInt(m[2] || "0", 10), 0, 59);
  return { hh, mm };
}

function normalize(v: string): string {
  const { hh, mm } = parseHM(v);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}
