"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./admin.module.css";

type Option = { value: string; label: string };

type Props = {
  value: string;
  endpoint: string;
  options: Option[];
};

export default function StatusSelect({ value, endpoint, options }: Props) {
  const router = useRouter();
  const [current, setCurrent] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus(nextStatus: string) {
    const previous = current;
    setCurrent(nextStatus);
    setSaving(true);
    setError("");

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "No se ha podido actualizar el estado.");
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
        onChange={(event) => updateStatus(event.target.value)}
        aria-label="Cambiar estado"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
