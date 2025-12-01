"use client";

/**
 * Subjective Metrics Logging Form
 *
 * Quick daily form for logging mood, energy, stress, and focus quality (1-10 scales).
 */

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SubjectiveMetricsFormProps {
  date?: string; // YYYY-MM-DD format, defaults to today
  onSuccess?: () => void;
}

export function SubjectiveMetricsForm({ date, onSuccess }: SubjectiveMetricsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [mood, setMood] = useState<number | "">("");
  const [energy, setEnergy] = useState<number | "">("");
  const [stress, setStress] = useState<number | "">("");
  const [focusQuality, setFocusQuality] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const targetDate = date || new Date().toISOString().split("T")[0];

      const payload: Record<string, unknown> = {
        date: targetDate,
      };

      if (mood !== "") payload.mood = mood;
      if (energy !== "") payload.energy = energy;
      if (stress !== "") payload.stress = stress;
      if (focusQuality !== "") payload.focus_quality = focusQuality;
      if (notes.trim()) payload.notes = notes.trim();

      const response = await fetch("/api/metrics/subjective", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to save metrics");
      }

      setSuccess(true);
      if (onSuccess) onSuccess();

      // Clear form after 2 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save metrics");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Daily Subjective Metrics</h3>
        <p className="text-sm text-muted-foreground">
          How are you feeling today? (1-10 scale)
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Mood */}
            <div>
              <label htmlFor="mood" className="block text-sm font-medium mb-1">
                Mood
              </label>
              <Input
                id="mood"
                type="number"
                min="1"
                max="10"
                value={mood}
                onChange={(e) => setMood(e.target.value ? parseInt(e.target.value) : "")}
                placeholder="1-10"
              />
            </div>

            {/* Energy */}
            <div>
              <label htmlFor="energy" className="block text-sm font-medium mb-1">
                Energy
              </label>
              <Input
                id="energy"
                type="number"
                min="1"
                max="10"
                value={energy}
                onChange={(e) => setEnergy(e.target.value ? parseInt(e.target.value) : "")}
                placeholder="1-10"
              />
            </div>

            {/* Stress */}
            <div>
              <label htmlFor="stress" className="block text-sm font-medium mb-1">
                Stress
              </label>
              <Input
                id="stress"
                type="number"
                min="1"
                max="10"
                value={stress}
                onChange={(e) => setStress(e.target.value ? parseInt(e.target.value) : "")}
                placeholder="1-10"
              />
            </div>

            {/* Focus Quality */}
            <div>
              <label htmlFor="focusQuality" className="block text-sm font-medium mb-1">
                Focus
              </label>
              <Input
                id="focusQuality"
                type="number"
                min="1"
                max="10"
                value={focusQuality}
                onChange={(e) => setFocusQuality(e.target.value ? parseInt(e.target.value) : "")}
                placeholder="1-10"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations about today..."
              className="w-full min-h-[80px] p-2 border rounded-md text-sm resize-y"
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
              Metrics saved successfully!
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Saving..." : "Save Metrics"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
