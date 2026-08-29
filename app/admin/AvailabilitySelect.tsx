"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./admin.module.css";

const options = [
  { value: "available", label: "Disponible" },
  { value: "limited", label: "Disponibilidad limitada" },
  { value: "unavailable", label: "No disponible temporalmente" },
];

export default function AvailabilitySelect({ value, endpoint }: { value: string; endpoint: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState(value || "available");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function updateAvailability(nextStatus: string) {
    const previous = current;
    setCurrent(nextStatus);
    setSaving(true);
    setError("");

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availabilityStatus: nextStatus }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "No se ha podido actualizar la disponibilidad.");
      }

      router.refresh();
    } catch (err) {
      setCurrent(previous);
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <select
        className={styles.statusSelect}
        value={current}
        disabled={saving}
        onChange={(event) => updateAvailability(event.target.value)}
        aria-label="Cambiar disponibilidad"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
