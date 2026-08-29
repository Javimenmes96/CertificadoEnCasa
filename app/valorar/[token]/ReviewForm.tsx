"use client";

import { FormEvent, useState } from "react";

type SubmitState = "idle" | "sending" | "success" | "error";

export default function ReviewForm({ token, technicianName }: { token: string; technicianName: string }) {
  const [rating, setRating] = useState(0);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (!rating) {
      setSubmitState("error");
      setMessage("Selecciona una puntuación de 1 a 5 estrellas.");
      return;
    }

    setSubmitState("sending");
    setMessage("");

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          rating,
          comment: formData.get("comment"),
          publishAccepted: formData.get("publishAccepted") === "on",
          company: formData.get("company"),
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "No hemos podido guardar la valoración.");
      }

      setSubmitState("success");
      setMessage(`Gracias. Tu valoración de ${technicianName} ya se ha publicado.`);
      form.reset();
    } catch (error) {
      setSubmitState("error");
      setMessage(error instanceof Error ? error.message : "Ha ocurrido un error.");
    }
  }

  if (submitState === "success") {
    return <div className="form-status success" role="status">{message}</div>;
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="field full">
        <label>Tu puntuación *</label>
        <div role="radiogroup" aria-label="Puntuación" style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} ${value === 1 ? "estrella" : "estrellas"}`}
              onClick={() => {
                setRating(value);
                setMessage("");
                setSubmitState("idle");
              }}
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                border: rating >= value ? "2px solid #1677ff" : "1px solid #d7dde7",
                background: rating >= value ? "#eef5ff" : "#fff",
                fontSize: 26,
                cursor: "pointer",
              }}
            >
              ★
            </button>
          ))}
        </div>
        <p className="form-note" style={{ marginTop: 8 }}>{rating ? `${rating}/5` : "Selecciona de 1 a 5 estrellas"}</p>
      </div>

      <div className="field full" style={{ marginTop: 20 }}>
        <label htmlFor="comment">Comentario</label>
        <textarea
          id="comment"
          name="comment"
          maxLength={1200}
          placeholder={`Cuéntanos cómo fue tu experiencia con ${technicianName}.`}
        />
      </div>

      <div className="honeypot" aria-hidden="true">
        <label htmlFor="company">Empresa</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="field full checkbox-field" style={{ marginTop: 18 }}>
        <label>
          <input type="checkbox" name="publishAccepted" required />
          <span>
            Acepto que esta valoración se publique en el perfil del técnico. Mi nombre se mostrará de forma abreviada y nunca se publicarán mi email ni mi teléfono. *
          </span>
        </label>
      </div>

      <button className="button" type="submit" disabled={submitState === "sending" || !rating} style={{ marginTop: 22 }}>
        {submitState === "sending" ? "Publicando…" : "Publicar valoración"}
      </button>

      {message && submitState === "error" && (
        <div className="form-status error" role="alert" style={{ marginTop: 16 }}>{message}</div>
      )}
    </form>
  );
}
