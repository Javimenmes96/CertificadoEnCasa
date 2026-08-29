import Link from "next/link";
import LocationSearchForm from "./LocationSearchForm";
import { findPostalPlace, lookupSpanishPostalCode, normalizePlace } from "@/lib/postal";

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

type PageSearchParams = Promise<{
  cp?: string | string[];
  municipio?: string | string[];
}>;

const provinceAliases: Record<string, string[]> = {
  alava: ["alava", "araba"],
  alicante: ["alicante", "alacant"],
  "illes balears": ["illes balears", "islas baleares", "baleares"],
  castellon: ["castellon", "castello"],
  "a coruna": ["a coruna", "la coruna", "coruna"],
  girona: ["girona", "gerona"],
  gipuzkoa: ["gipuzkoa", "guipuzcoa"],
  lleida: ["lleida", "lerida"],
  ourense: ["ourense", "orense"],
  valencia: ["valencia", "valencia"],
  bizkaia: ["bizkaia", "vizcaya"],
};

function supabaseHeaders(key: string) {
  const headers: Record<string, string> = { apikey: key };
  if (!key.startsWith("sb_secret_")) headers.Authorization = `Bearer ${key}`;
  return headers;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "T";
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function provinceMentionedAsArea(zones: string, province: string) {
  const normalizedZones = normalizePlace(zones);
  const normalizedProvince = normalizePlace(province);
  const aliases = provinceAliases[normalizedProvince] || [normalizedProvince];

  const separatedAreas = zones
    .split(/[,;/|]+/)
    .map((area) => normalizePlace(area))
    .filter(Boolean);

  return aliases.some((alias) =>
    separatedAreas.some((area) =>
      area === alias ||
      area === `provincia de ${alias}` ||
      area === `toda ${alias}` ||
      area === `toda la provincia de ${alias}` ||
      area === `comunidad de ${alias}` ||
      area === `comunidad autonoma de ${alias}`,
    ) || normalizedZones === alias,
  );
}

function technicianCoversLocation(
  tecnico: PublicTechnician,
  postalCode: string,
  municipality: string,
  province: string,
) {
  const zones = normalizePlace(tecnico.work_zones);
  const normalizedMunicipality = normalizePlace(municipality);
  const normalizedCity = normalizePlace(tecnico.city);

  if (["toda espana", "toda espana peninsular", "nacional", "todo el territorio nacional"].some((term) => zones.includes(term))) {
    return true;
  }

  if (zones.includes(postalCode)) return true;
  if (normalizedMunicipality && zones.includes(normalizedMunicipality)) return true;
  if (normalizedCity === normalizedMunicipality) return true;
  if (province && provinceMentionedAsArea(tecnico.work_zones, province)) return true;

  return false;
}

async function getVerifiedTechnicians(): Promise<PublicTechnician[]> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) return [];

  const select = [
    "id", "name", "city", "province", "qualification", "years_experience",
    "work_zones", "travel_radius_km", "price_from_eur",
  ].join(",");

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/technician_applications?select=${select}&status=eq.verified&order=price_from_eur.asc.nullslast,created_at.asc`,
    { headers: supabaseHeaders(secretKey), cache: "no-store" },
  );

  if (!response.ok) {
    console.error("Public technicians fetch failed:", response.status, await response.text());
    return [];
  }

  return await response.json() as PublicTechnician[];
}

export default async function TecnicosPage({ searchParams }: { searchParams: PageSearchParams }) {
  const params = await searchParams;
  const postalCode = firstParam(params.cp).replace(/\D/g, "").slice(0, 5);
  const municipalityParam = firstParam(params.municipio).trim().slice(0, 100);

  const lookup = /^\d{5}$/.test(postalCode) ? await lookupSpanishPostalCode(postalCode) : null;
  const matchedPlace = municipalityParam ? findPostalPlace(lookup, municipalityParam) : null;
  const hasSearch = Boolean(matchedPlace);
  const municipality = matchedPlace?.municipality || municipalityParam;
  const province = matchedPlace?.province || "";
  const invalidCombination = Boolean(postalCode && municipalityParam && lookup && !matchedPlace);
  const invalidPostalCode = Boolean(postalCode && !lookup);

  const allTechnicians = hasSearch ? await getVerifiedTechnicians() : [];
  const tecnicos = matchedPlace
    ? allTechnicians.filter((tecnico) => technicianCoversLocation(tecnico, postalCode, matchedPlace.municipality, matchedPlace.province))
    : [];

  const query = new URLSearchParams();
  if (postalCode) query.set("cp", postalCode);
  if (matchedPlace?.municipality) query.set("municipio", matchedPlace.municipality);
  const locationQuery = query.toString();
  const locationSuffix = locationQuery ? `?${locationQuery}` : "";

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Técnicos verificados</span>
          <h1>Encuentra profesionales que trabajen en tu zona.</h1>
          <p>Escribe el código postal del inmueble. Comprobaremos automáticamente el municipio y te mostraremos solo técnicos que cubren esa zona.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <LocationSearchForm initialPostalCode={postalCode} initialMunicipality={matchedPlace?.municipality || ""} />

          {invalidCombination && (
            <div className="form-status error" role="alert" style={{ marginTop: 18 }}>
              El código postal {postalCode} no corresponde con “{municipalityParam}”. El municipio se obtiene ahora automáticamente a partir del código postal.
            </div>
          )}

          {invalidPostalCode && (
            <div className="form-status error" role="alert" style={{ marginTop: 18 }}>
              No hemos encontrado el código postal {postalCode} en España. Compruébalo e inténtalo de nuevo.
            </div>
          )}

          {!hasSearch ? (
            <div className="location-search-empty">
              <strong>Primero indica el código postal.</strong>
              <p>El municipio ya no se escribe libremente: lo validamos para evitar combinaciones incorrectas.</p>
            </div>
          ) : tecnicos.length === 0 ? (
            <div className="form-card location-no-results">
              <span className="eyebrow">Sin coincidencias por ahora</span>
              <h2 style={{ fontSize: 30 }}>Todavía no tenemos un técnico verificado para {municipality}.</h2>
              <p className="lead">Puedes dejarnos los datos del inmueble. No te asignaremos un profesional automáticamente; podrás elegir cuando haya opciones disponibles en tu zona.</p>
              <div className="hero-actions">
                <Link href={`/solicitar${locationSuffix}`} className="button">Dejar mi solicitud</Link>
                <Link href="/tecnicos" className="button button-secondary">Cambiar ubicación</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="location-results-heading">
                <div>
                  <span className="eyebrow">Resultados en tu zona</span>
                  <h2>{tecnicos.length} {tecnicos.length === 1 ? "técnico disponible" : "técnicos disponibles"} para {municipality}</h2>
                  {province && <p style={{ margin: 0, color: "var(--muted)" }}>{province}</p>}
                </div>
                <span className="location-result-badge">CP {postalCode}</span>
              </div>

              <div className="tech-grid">
                {tecnicos.map((tecnico) => (
                  <article className="tech-card" key={tecnico.id}>
                    <div className="tech-head">
                      <div className="avatar">{initials(tecnico.name)}</div>
                      <div>
                        <h3 style={{ marginBottom: 2 }}>{tecnico.name}</h3>
                        <span style={{ color: "var(--muted)" }}>{tecnico.city}, {tecnico.province}</span>
                      </div>
                    </div>
                    <div className="verified-line">✓ Profesional verificado</div>
                    <p style={{ color: "var(--muted)", marginTop: 14 }}>{tecnico.qualification}</p>
                    <div className="tech-meta">
                      {tecnico.years_experience !== null && <span className="tag">{tecnico.years_experience} años de experiencia</span>}
                      {tecnico.travel_radius_km !== null && <span className="tag">Radio {tecnico.travel_radius_km} km</span>}
                    </div>
                    <p className="tech-zones"><strong>Zonas:</strong> {tecnico.work_zones}</p>
                    <div className="tech-choice-row">
                      <div>
                        <span style={{ color: "var(--muted)", fontSize: 13 }}>Precio orientativo desde</span>
                        <div className="price">{tecnico.price_from_eur !== null ? `${tecnico.price_from_eur} €` : "Consultar"}</div>
                      </div>
                      <div className="tech-choice-actions">
                        <Link href={`/tecnicos/${tecnico.id}${locationSuffix}`} className="button button-secondary button-small">Ver perfil</Link>
                        <Link href={`/solicitar?tecnico=${tecnico.id}&${locationQuery}`} className="button button-small">Elegir</Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="section section-white">
        <div className="container split">
          <div>
            <span className="eyebrow">Tú decides</span>
            <h2 style={{ marginTop: 16 }}>La plataforma no te asigna un técnico.</h2>
            <p className="lead">Validamos la ubicación, filtramos las opciones y tú eliges con quién quieres trabajar.</p>
          </div>
          <div className="panel">
            <h3>¿Eres técnico?</h3>
            <p>Indica con precisión tus municipios, provincias o códigos postales de trabajo para aparecer ante los clientes adecuados.</p>
            <Link href="/unete-como-tecnico" className="button button-secondary">Únete como técnico</Link>
          </div>
        </div>
      </section>
    </>
  );
}
