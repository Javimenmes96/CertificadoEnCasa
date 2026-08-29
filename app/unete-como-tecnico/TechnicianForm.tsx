"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type SubmitState = "idle" | "sending" | "success" | "error";

type PostalPlace = {
  municipality: string;
  province: string;
};

type PostalLookup = {
  postalCode: string;
  places: PostalPlace[];
};

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function TechnicianForm() {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [places, setPlaces] = useState<PostalPlace[]>([]);
  const [municipality, setMunicipality] = useState("");
  const [postalLoading, setPostalLoading] = useState(false);
  const [postalError, setPostalError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const cp = postalCode.replace(/\D/g, "").slice(0, 5);

    if (cp.length !== 5) {
      setPlaces([]);
      setMunicipality("");
      setPostalError("");
      return;
    }

    setPostalLoading(true);
    setPostalError("");

    fetch(`/api/postal-code/${cp}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "No hemos podido comprobar el código postal.");
        return data as PostalLookup;
      })
      .then((data) => {
        if (cancelled) return;
        const nextPlaces = data.places || [];
        setPlaces(nextPlaces);
        setMunicipality(nextPlaces[0]?.municipality || "");
      })
      .catch((error) => {
        if (cancelled) return;
        setPlaces([]);
        setMunicipality("");
        setPostalError(error instanceof Error ? error.message : "No hemos podido comprobar el código postal.");
      })
      .finally(() => {
        if (!cancelled) setPostalLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [postalCode]);

  const selectedPlace = useMemo(
    () => places.find((place) => place.municipality === municipality) || null,
    [places, municipality],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const cp = postalCode.replace(/\D/g, "").slice(0, 5);

    if (!/^\d{5}$/.test(cp) || !selectedPlace) {
      setSubmitState("error");
      setMessage("Introduce un código postal válido y espera a que identifiquemos el municipio.");
      return;
    }

    const avatar = formData.get("avatar");
    if (avatar instanceof File && avatar.size > 0) {
      if (!ALLOWED_AVATAR_TYPES.has(avatar.type)) {
        setSubmitState("error");
        setMessage("La foto debe ser JPG, PNG o WEBP.");
        return;
      }
      if (avatar.size > MAX_AVATAR_BYTES) {
        setSubmitState("error");
        setMessage("La foto no puede superar los 2 MB.");
        return;
      }
    }

    formData.set("postalCode", cp);
    formData.set("city", selectedPlace.municipality);
    formData.set("province", selectedPlace.province);
    formData.set("competenceDeclared", formData.get("competence") === "on" ? "true" : "false");
    formData.set("privacyAccepted", formData.get("privacy") === "on" ? "true" : "false");

    setSubmitState("sending");
    setMessage("");

    try {
      const response = await fetch("/api/technicians", {
        method: "POST",
        body: formData,
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "No se ha podido enviar la solicitud.");
      }

      setSubmitState("success");
      setMessage("Solicitud recibida. Revisaremos tus datos y contactaremos contigo para verificar tu perfil.");
      form.reset();
      setPostalCode("");
      setPlaces([]);
      setMunicipality("");
      setPostalError("");
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

        <div className="field full">
          <label htmlFor="tech-avatar">Foto de perfil</label>
          <input id="tech-avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" />
          <span className="form-note">
            Opcional. JPG, PNG o WEBP, máximo 2 MB. Si tu perfil es verificado, esta foto se mostrará públicamente junto a tus datos profesionales.
          </span>
        </div>

        <div className="field">
          <label htmlFor="tech-cp">Código postal base *</label>
          <input
            id="tech-cp"
            name="postalCode"
            inputMode="numeric"
            pattern="[0-9]{5}"
            maxLength={5}
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="Ej. 28521"
            autoComplete="postal-code"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="tech-city">Municipio base *</label>
          {places.length > 1 ? (
            <select
              id="tech-city"
              value={municipality}
              onChange={(event) => setMunicipality(event.target.value)}
              required
            >
              {places.map((place) => (
                <option key={`${place.municipality}-${place.province}`} value={place.municipality}>
                  {place.municipality}{place.province ? ` · ${place.province}` : ""}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="tech-city"
              value={postalLoading ? "Comprobando…" : selectedPlace?.municipality || ""}
              placeholder="Se completa automáticamente"
              readOnly
              aria-readonly="true"
              required
            />
          )}
        </div>

        <div className="field full">
          {selectedPlace && (
            <span className="postal-confirmation">
              ✓ Base: CP {postalCode} · {selectedPlace.municipality}{selectedPlace.province ? `, ${selectedPlace.province}` : ""}
            </span>
          )}
          {postalError && <div className="form-status error" role="alert">{postalError}</div>}
        </div>

        <div className="field">
          <label htmlFor="tech-qualification">Titulación habilitante *</label>
          <input id="tech-qualification" name="qualification" maxLength={180} placeholder="Ej. Ingeniero Técnico Industrial" required />
        </div>

        <div className="field">
          <label htmlFor="tech-number">N.º colegiado / registro</label>
          <input id="tech-number" name="professionalNumber" maxLength={100} placeholder="Si dispones de él" />
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

        <div className="field full">
          <label htmlFor="tech-price">Precio orientativo desde (€) *</label>
          <input id="tech-price" name="priceFromEur" type="number" min="1" max="10000" step="0.01" placeholder="Ej. 80" required />
          <span className="form-note">Indica un precio de partida realista. El importe final lo acuerdas directamente con el cliente según el inmueble y las condiciones del servicio.</span>
        </div>

        <div className="field full">
          <label htmlFor="tech-notes">Cuéntanos algo más</label>
          <textarea id="tech-notes" name="notes" maxLength={1800} placeholder="Experiencia con CEE, tipos de inmueble que sueles certificar, horarios, etc." />
        </div>

        <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
          <label htmlFor="tech-company">Empresa</label>
          <input id="tech-company" name="company" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="field full">
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontWeight: 400 }}>
            <input type="checkbox" name="competence" required style={{ width: 16, marginTop: 3 }} />
            <span>
              Declaro que dispongo de una titulación que me habilita para emitir Certificados de Eficiencia Energética y que facilitaré la documentación acreditativa durante la verificación. *
            </span>
          </label>
        </div>

        <div className="field full">
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontWeight: 400 }}>
            <input type="checkbox" name="privacy" required style={{ width: 16, marginTop: 3 }} />
            <span>
              He leído y acepto la <Link href="/politica-de-privacidad" style={{ textDecoration: "underline" }}>Política de privacidad</Link>, autorizo el tratamiento de mis datos para gestionar el alta y, si mi perfil es verificado, la publicación de los datos profesionales y de la foto de perfil que haya facilitado. *
            </span>
          </label>
        </div>
      </div>

      <button className="button" type="submit" disabled={submitState === "sending" || postalLoading || !selectedPlace} style={{ marginTop: 22 }}>
        {submitState === "sending" ? "Enviando…" : postalLoading ? "Comprobando ubicación…" : "Solicitar alta como técnico"}
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
