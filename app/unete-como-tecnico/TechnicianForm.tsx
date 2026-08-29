"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type SubmitState = "idle" | "sending" | "success" | "error";

export default function TechnicianForm() {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setSubmitState("sending");
    setMessage("");

    try {
      const response = await fetch("/api/technicians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          city: formData.get("city"),
          province: formData.get("province"),
          qualification: formData.get("qualification"),
          professionalNumber: formData.get("professionalNumber"),
          yearsExperience: formData.get("yearsExperience"),
          workZones: formData.get("workZones"),
          travelRadiusKm: formData.get("travelRadiusKm"),
          priceFromEur: formData.get("priceFromEur"),
          notes: formData.get("notes"),
          privacyAccepted: formData.get("privacy") === "on",
          company: formData.get("company"),
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "No se ha podido enviar la solicitud.");
      }

      setSubmitState("success");
      setMessage("Solicitud recibida. Revisaremos tus datos y contactaremos contigo para verificar tu perfil.");
      form.reset();
    } catch (error) {
      setSubmitState("error");
      setMessage(error instanceof Error ? error.message : "Ha ocurrido un error. Inténtalo de nuevo.");
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="tech-name">Nombre y apellidos *</label>
          <input id="tech-name" name="name" autoComplete="name" maxLength={120} required />
        </div>

        <div className="field">
          <label htmlFor="tech-phone">Teléfono *</label>
          <input id="tech-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} required />
        </div>

        <div className="field full">
          <label htmlFor="tech-email">Email profesional *</label>
          <input id="tech-email" name="email" type="email" autoComplete="email" maxLength={200} required />
        </div>

        <div className="field">
          <label htmlFor="tech-city">Municipio base *</label>
          <input id="tech-city" name="city" maxLength={100} placeholder="Ej. Rivas-Vaciamadrid" required />
        </div>

        <div className="field">
          <label htmlFor="tech-province">Provincia *</label>
          <input id="tech-province" name="province" maxLength={100} placeholder="Ej. Madrid" required />
        </div>

        <div className="field">
          <label htmlFor="tech-qualification">Titulación habilitante *</label>
          <input id="tech-qualification" name="qualification" maxLength={180} placeholder="Ej. Ingeniero Técnico Industrial" required />
        </div>

        <div className="field">
          <label htmlFor="tech-number">N.º colegiado / registro</label>
          <input id="tech-number" name="professionalNumber" maxLength={100} placeholder="Opcional" />
        </div>

        <div className="field">
          <label htmlFor="tech-years">Años de experiencia</label>
          <input id="tech-years" name="yearsExperience" type="number" min="0" max="70" />
        </div>

        <div className="field">
          <label htmlFor="tech-radius">Radio de desplazamiento (km)</label>
          <input id="tech-radius" name="travelRadiusKm" type="number" min="0" max="1000" placeholder="Ej. 30" />
        </div>

        <div className="field full">
          <label htmlFor="tech-zones">Zonas donde trabajas *</label>
          <input id="tech-zones" name="workZones" maxLength={500} placeholder="Ej. Madrid capital, Rivas-Vaciamadrid, Arganda del Rey, CP 28521…" required />
          <span className="form-note">Indica municipios, provincias completas o códigos postales con precisión. Usaremos este campo para mostrar tu perfil solo a clientes de esas zonas.</span>
        </div>

        <div className="field">
          <label htmlFor="tech-price">Precio orientativo desde (€)</label>
          <input id="tech-price" name="priceFromEur" type="number" min="0" max="10000" step="0.01" placeholder="Ej. 80" />
        </div>

        <div className="field full">
          <label htmlFor="tech-notes">Cuéntanos algo más</label>
          <textarea id="tech-notes" name="notes" maxLength={1800} placeholder="Experiencia con CEE, disponibilidad, tipos de inmueble, etc." />
        </div>

        <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
          <label htmlFor="tech-company">Empresa</label>
          <input id="tech-company" name="company" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="field full">
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontWeight: 400 }}>
            <input type="checkbox" name="privacy" required style={{ width: 16, marginTop: 3 }} />
            <span>
              He leído y acepto la <Link href="/politica-de-privacidad" style={{ textDecoration: "underline" }}>Política de privacidad</Link> y autorizo el tratamiento de mis datos para gestionar mi solicitud de alta. *
            </span>
          </label>
        </div>
      </div>

      <button className="button" type="submit" disabled={submitState === "sending"} style={{ marginTop: 22 }}>
        {submitState === "sending" ? "Enviando…" : "Solicitar alta como técnico"}
      </button>

      <p className="form-note">* Campos obligatorios. La solicitud no supone la publicación automática del perfil: primero verificaremos la habilitación profesional.</p>

      {message && (
        <div
          role="status"
          aria-live="polite"
          style={{
            marginTop: 16,
            padding: "14px 16px",
            borderRadius: 11,
            border: submitState === "success" ? "1px solid #b8dec2" : "1px solid #e5b5b1",
            background: submitState === "success" ? "#eff9f1" : "#fff1ef",
            color: submitState === "success" ? "#225d31" : "#8b2e28",
            fontWeight: 700,
          }}
        >
          {message}
        </div>
      )}
    </form>
  );
}
