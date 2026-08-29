"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./HomePostalSearch.module.css";

type PostalPlace = {
  municipality: string;
  province: string;
};

type PostalLookup = {
  postalCode: string;
  places: PostalPlace[];
};

export default function HomePostalSearch() {
  const router = useRouter();
  const [postalCode, setPostalCode] = useState("");
  const [places, setPlaces] = useState<PostalPlace[]>([]);
  const [municipality, setMunicipality] = useState("");
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
        const nextPlaces = data.places || [];
        setPlaces(nextPlaces);
        setMunicipality(nextPlaces[0]?.municipality || "");
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
  }, [postalCode]);

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
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={`field ${styles.field}`}>
        <label htmlFor="home-cp">Código postal del inmueble *</label>
        <input
          id="home-cp"
          name="cp"
          inputMode="numeric"
          pattern="[0-9]{5}"
          maxLength={5}
          value={postalCode}
          onChange={(event) => setPostalCode(event.target.value.replace(/\D/g, "").slice(0, 5))}
          placeholder="28001"
          autoComplete="postal-code"
          required
        />
      </div>

      {places.length > 1 && (
        <div className={`field ${styles.field}`}>
          <label htmlFor="home-municipio">Municipio</label>
          <select
            id="home-municipio"
            value={municipality}
            onChange={(event) => setMunicipality(event.target.value)}
          >
            {places.map((place) => (
              <option key={`${place.municipality}-${place.province}`} value={place.municipality}>
                {place.municipality}{place.province ? ` · ${place.province}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <button type="submit" className={`button ${styles.button}`} disabled={loading || !selectedPlace}>
        {loading ? "Comprobando…" : "Ver técnicos disponibles"}
      </button>

      <div className={styles.feedback} aria-live="polite">
        {selectedPlace && (
          <span className={styles.confirmation}>
            ✓ {selectedPlace.municipality}{selectedPlace.province ? `, ${selectedPlace.province}` : ""}
          </span>
        )}
        {error && <span className={styles.error} role="alert">{error}</span>}
      </div>
    </form>
  );
}
