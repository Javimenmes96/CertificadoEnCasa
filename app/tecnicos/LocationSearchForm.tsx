"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PostalPlace = {
  municipality: string;
  province: string;
};

type PostalLookup = {
  postalCode: string;
  places: PostalPlace[];
};

export default function LocationSearchForm({
  initialPostalCode = "",
  initialMunicipality = "",
}: {
  initialPostalCode?: string;
  initialMunicipality?: string;
}) {
  const router = useRouter();
  const [postalCode, setPostalCode] = useState(initialPostalCode);
  const [places, setPlaces] = useState<PostalPlace[]>([]);
  const [municipality, setMunicipality] = useState(initialMunicipality);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const cp = postalCode.replace(/\D/g, "").slice(0, 5);

    if (cp.length !== 5) {
      setPlaces([]);
      setMunicipality("");
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    fetch(`/api/postal-code/${cp}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "No hemos podido comprobar el código postal.");
        return data as PostalLookup;
      })
      .then((data) => {
        if (cancelled) return;
        setPlaces(data.places || []);

        const current = (data.places || []).find(
          (place) => place.municipality.toLocaleLowerCase("es") === initialMunicipality.toLocaleLowerCase("es"),
        );
        setMunicipality(current?.municipality || data.places?.[0]?.municipality || "");
      })
      .catch((err) => {
        if (cancelled) return;
        setPlaces([]);
        setMunicipality("");
        setError(err instanceof Error ? err.message : "No hemos podido comprobar el código postal.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [postalCode, initialMunicipality]);

  const selectedPlace = useMemo(
    () => places.find((place) => place.municipality === municipality) || null,
    [places, municipality],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cp = postalCode.replace(/\D/g, "").slice(0, 5);
    if (!/^\d{5}$/.test(cp) || !selectedPlace) {
      setError("Introduce un código postal válido y espera a que identifiquemos el municipio.");
      return;
    }

    const query = new URLSearchParams({ cp, municipio: selectedPlace.municipality });
    router.push(`/tecnicos?${query.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="location-search-card">
      <div className="location-search-copy">
        <span className="eyebrow">Ubicación del inmueble</span>
        <h2>¿Dónde necesitas el certificado?</h2>
        <p>Escribe el código postal y nosotros identificamos el municipio para evitar errores.</p>
      </div>

      <div className="location-search-fields">
        <div className="field">
          <label htmlFor="search-cp">Código postal *</label>
          <input
            id="search-cp"
            name="cp"
            inputMode="numeric"
            pattern="[0-9]{5}"
            maxLength={5}
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="28001"
            required
          />
        </div>

        <div className="field location-search-municipality">
          <label htmlFor="search-municipio">Municipio</label>
          {places.length > 1 ? (
            <select
              id="search-municipio"
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
              id="search-municipio"
              value={loading ? "Comprobando…" : selectedPlace?.municipality || ""}
              placeholder="Se completa automáticamente"
              readOnly
              aria-readonly="true"
            />
          )}
        </div>

        <button
          type="submit"
          className="button location-search-button"
          disabled={loading || !selectedPlace}
        >
          {loading ? "Comprobando…" : "Ver técnicos disponibles"}
        </button>
      </div>

      {selectedPlace && (
        <p className="postal-confirmation">✓ CP {postalCode}: {selectedPlace.municipality}{selectedPlace.province ? `, ${selectedPlace.province}` : ""}</p>
      )}
      {error && <div className="form-status error" role="alert">{error}</div>}
    </form>
  );
}
