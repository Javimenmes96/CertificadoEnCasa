"use client";

import { useState } from "react";

export default function ChargeSettlementButton({
  settlementId,
  retry = false,
}: {
  settlementId: string;
  retry?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function charge() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/admin/api/settlements/${settlementId}/charge`, {
        method: "POST",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "No se ha podido cobrar la liquidación.");
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se ha podido cobrar la liquidación.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="button"
        onClick={charge}
        disabled={loading}
        style={{ minWidth: 132, padding: "9px 12px", fontSize: 13 }}
      >
        {loading ? "Cobrando…" : retry ? "Reintentar cobro" : "Cobrar ahora"}
      </button>
      {error && <div style={{ marginTop: 7, color: "#9b2c2c", fontSize: 12, maxWidth: 240 }}>{error}</div>}
    </div>
  );
}
