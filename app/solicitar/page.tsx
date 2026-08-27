"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type SubmitState = "idle" | "sending" | "success" | "error";

export default function SolicitarPage() {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setSubmitState("sending");
    setMessage("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postalCode: formData.get("postalCode"),
          municipality: formData.get("municipality"),
          propertyType: formData.get("propertyType"),
          surfaceM2: formData.get("surfaceM2"),
          reason: formData.get("reason"),
          notes: formData.get("notes"),
          name: formData.get("name"),
          phone: formData.get("phone"),
          email: formData.get("email"),
          privacyAccepted: formData.get("privacy") === "on",
          company: formData.get("company"),
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "No se ha podido enviar la solicitud.");
      }

      setSubmitState("success");
      setMessage("Solicitud recibida. Buscaremos técnicos disponibles en tu zona y contactaremos contigo.");
      form.reset();
    } catch (error) {
      setSubmitState("error");
      setMessage(error instanceof Error ? error.message : "Ha ocurrido un error. Inténtalo de nuevo.");
    }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Pedir certificado</span>
          <h1>Cuéntanos qué inmueble necesitas certificar.</h1>
          <p>
            Déjanos los datos básicos del inmueble y buscaremos técnicos verificados disponibles en tu zona. Podrás comparar antes de elegir.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <form className="form-card" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="postalCode">Código postal *</label>
                <input id="postalCode" name="postalCode" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} placeholder="28001" required />
              </div>

              <div className="field">
                <label htmlFor="municipality">Municipio *</label>
                <input id="municipality" name="municipality" placeholder="Ej. Rivas-Vaciamadrid" maxLength={100} required />
              </div>

              <div className="field">
                <label htmlFor="propertyType">Tipo de inmueble *</label>
                <select id="propertyType" name="propertyType" defaultValue="" required>
                  <option value="" disabled>Selecciona</option>
                  <option value="Piso">Piso</option>
                  <option value="Vivienda unifamiliar">Vivienda unifamiliar</option>
                  <option value="Local">Local</option>
                  <option value="Oficina">Oficina</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="surfaceM2">Superficie aproximada</label>
                <input id="surfaceM2" name="surfaceM2" type="number" inputMode="numeric" min="1" max="100000" placeholder="Ej. 85" />
              </div>

              <div className="field full">
                <label htmlFor="reason">Motivo del certificado</label>
                <select id="reason" name="reason" defaultValue="">
                  <option value="">Selecciona si lo sabes</option>
                  <option value="Venta">Venta</option>
                  <option value="Alquiler">Alquiler</option>
                  <option value="Ayuda o subvención">Ayuda o subvención</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="field full">
                <label htmlFor="notes">Información adicional</label>
                <textarea id="notes" name="notes" maxLength={1500} placeholder="Añade cualquier detalle que pueda ayudar al técnico." />
              </div>

              <div className="field">
                <label htmlFor="name">Nombre *</label>
                <input id="name" name="name" autoComplete="name" maxLength={120} placeholder="Tu nombre" required />
              </div>

              <div className="field">
                <label htmlFor="phone">Teléfono *</label>
                <input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={30} placeholder="600 000 000" required />
              </div>

              <div className="field full">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" autoComplete="email" maxLength={200} placeholder="tu@email.com" />
              </div>

              <div className="honeypot" aria-hidden="true">
                <label htmlFor="company">Empresa</label>
                <input id="company" name="company" tabIndex={-1} autoComplete="off" />
              </div>

              <div className="field full checkbox-field">
                <label>
                  <input type="checkbox" name="privacy" required />
                  <span>
                    He leído y acepto la <Link href="/politica-de-privacidad">Política de privacidad</Link> y autorizo el tratamiento de mis datos para gestionar esta solicitud. *
                  </span>
                </label>
              </div>
            </div>

            <button className="button" type="submit" disabled={submitState === "sending"} style={{ marginTop: 22 }}>
              {submitState === "sending" ? "Enviando…" : "Buscar técnicos disponibles"}
            </button>

            <p className="form-note">* Campos obligatorios. No compartiremos tus datos con un técnico hasta que sea necesario para gestionar tu solicitud.</p>

            {message && (
              <div className={`form-status ${submitState === "success" ? "success" : "error"}`} role="status" aria-live="polite">
                {message}
              </div>
            )}
          </form>
        </div>
      </section>
    </>
  );
}
