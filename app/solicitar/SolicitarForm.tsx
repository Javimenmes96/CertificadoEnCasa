"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type SubmitState = "idle" | "sending" | "success" | "error";

type PublicTechnician = {
  id: string;
  name: string;
  city: string;
  province: string;
  qualification: string;
  years_experience: number | null;
  work_zones: string;
  travel_radius_km: number | null;
  price_from_eur: number | null;
};

export default function SolicitarForm() {
  const searchParams = useSearchParams();
  const technicianId = searchParams.get("tecnico");

  const [technician, setTechnician] = useState<PublicTechnician | null>(null);
  const [technicianLoading, setTechnicianLoading] = useState(Boolean(technicianId));
  const [technicianError, setTechnicianError] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!technicianId) {
      setTechnician(null);
      setTechnicianLoading(false);
      setTechnicianError("");
      return;
    }

    setTechnicianLoading(true);
    setTechnicianError("");

    fetch(`/api/public-technicians/${encodeURIComponent(technicianId)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "No se ha podido cargar el técnico.");
        return data.technician as PublicTechnician;
      })
      .then((data) => {
        if (!cancelled) setTechnician(data);
      })
      .catch((error) => {
        if (!cancelled) {
          setTechnician(null);
          setTechnicianError(error instanceof Error ? error.message : "Este técnico no está disponible.");
        }
      })
      .finally(() => {
        if (!cancelled) setTechnicianLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [technicianId]);

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
          selectedTechnicianId: technician?.id || null,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "No se ha podido enviar la solicitud.");
      }

      setSubmitState("success");
      setMessage(
        technician
          ? `Solicitud recibida. Has elegido a ${technician.name} y le enviaremos los datos necesarios para gestionar tu certificado.`
          : "Solicitud recibida. Puedes comparar técnicos verificados y elegir tú con quién quieres realizar el certificado.",
      );
      form.reset();
    } catch (error) {
      setSubmitState("error");
      setMessage(error instanceof Error ? error.message : "Ha ocurrido un error. Inténtalo de nuevo.");
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      {technicianLoading && (
        <div className="selected-technician-card">Cargando el técnico que has elegido…</div>
      )}

      {technician && (
        <div className="selected-technician-card">
          <div>
            <span className="selected-technician-label">Técnico elegido por ti</span>
            <h3>{technician.name}</h3>
            <p>{technician.city}, {technician.province} · {technician.qualification}</p>
            <p><strong>{technician.price_from_eur !== null ? `Desde ${technician.price_from_eur} €` : "Precio a consultar"}</strong></p>
          </div>
          <Link href="/tecnicos" className="button button-secondary button-small">Cambiar técnico</Link>
        </div>
      )}

      {technicianId && !technicianLoading && !technician && (
        <div className="legal-notice">
          {technicianError || "El técnico seleccionado ya no está disponible."} <Link href="/tecnicos"><strong>Elegir otro técnico</strong></Link>.
        </div>
      )}

      {!technicianId && (
        <div className="choice-prompt">
          <div>
            <strong>¿Quieres elegir tú al técnico?</strong>
            <p>Compara primero los profesionales verificados y vuelve con el que prefieras.</p>
          </div>
          <Link href="/tecnicos" className="button button-secondary button-small">Ver técnicos</Link>
        </div>
      )}

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
              He leído y acepto la <Link href="/politica-de-privacidad">Política de privacidad</Link>
              {technician ? " y autorizo que mis datos se compartan con el técnico que he elegido para gestionar esta solicitud." : " y autorizo el tratamiento de mis datos para gestionar esta solicitud."} *
            </span>
          </label>
        </div>
      </div>

      <button className="button" type="submit" disabled={submitState === "sending" || technicianLoading} style={{ marginTop: 22 }}>
        {submitState === "sending" ? "Enviando…" : technician ? `Enviar solicitud a ${technician.name}` : "Enviar solicitud"}
      </button>

      <p className="form-note">
        * Campos obligatorios. {technician ? "Tus datos se compartirán con el profesional que has elegido para que pueda gestionar el servicio." : "No asignamos un técnico por ti: podrás comparar y elegir el profesional que prefieras."}
      </p>

      {message && (
        <div className={`form-status ${submitState === "success" ? "success" : "error"}`} role="status" aria-live="polite">
          {message}
          {submitState === "success" && !technician && (
            <div style={{ marginTop: 12 }}><Link href="/tecnicos"><strong>Comparar técnicos verificados →</strong></Link></div>
          )}
        </div>
      )}
    </form>
  );
}
