import Link from "next/link";

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

const provinceByPostalPrefix: Record<string, string> = {
  "01": "Álava",
  "02": "Albacete",
  "03": "Alicante",
  "04": "Almería",
  "05": "Ávila",
  "06": "Badajoz",
  "07": "Illes Balears",
  "08": "Barcelona",
  "09": "Burgos",
  "10": "Cáceres",
  "11": "Cádiz",
  "12": "Castellón",
  "13": "Ciudad Real",
  "14": "Córdoba",
  "15": "A Coruña",
  "16": "Cuenca",
  "17": "Girona",
  "18": "Granada",
  "19": "Guadalajara",
  "20": "Gipuzkoa",
  "21": "Huelva",
  "22": "Huesca",
  "23": "Jaén",
  "24": "León",
  "25": "Lleida",
  "26": "La Rioja",
  "27": "Lugo",
  "28": "Madrid",
  "29": "Málaga",
  "30": "Murcia",
  "31": "Navarra",
  "32": "Ourense",
  "33": "Asturias",
  "34": "Palencia",
  "35": "Las Palmas",
  "36": "Pontevedra",
  "37": "Salamanca",
  "38": "Santa Cruz de Tenerife",
  "39": "Cantabria",
  "40": "Segovia",
  "41": "Sevilla",
  "42": "Soria",
  "43": "Tarragona",
  "44": "Teruel",
  "45": "Toledo",
  "46": "Valencia",
  "47": "Valladolid",
  "48": "Bizkaia",
  "49": "Zamora",
  "50": "Zaragoza",
  "51": "Ceuta",
  "52": "Melilla",
};

const provinceAliases: Record<string, string[]> = {
  "Álava": ["Álava", "Araba"],
  "Alicante": ["Alicante", "Alacant"],
  "Illes Balears": ["Illes Balears", "Islas Baleares", "Baleares"],
  "Castellón": ["Castellón", "Castelló"],
  "A Coruña": ["A Coruña", "La Coruña", "Coruña"],
  "Girona": ["Girona", "Gerona"],
  "Gipuzkoa": ["Gipuzkoa", "Guipúzcoa"],
  "Lleida": ["Lleida", "Lérida"],
  "Ourense": ["Ourense", "Orense"],
  "Valencia": ["Valencia", "València"],
  "Bizkaia": ["Bizkaia", "Vizcaya"],
};

function supabaseHeaders(key: string) {
  const headers: Record<string, string> = { apikey: key };
  if (!key.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${key}`;
  }
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

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function provinceMentionedAsArea(zones: string, province: string) {
  const normalizedZones = normalizeText(zones);
  const aliases = provinceAliases[province] || [province];

  return aliases.some((alias) => {
    const normalizedAlias = normalizeText(alias);
    if (normalizedZones === normalizedAlias) return true;

    const separatedAreas = normalizedZones
      .split(/[,;/|]+/)
      .map((area) => area.trim())
      .filter(Boolean);

    return separatedAreas.some((area) =>
      area === normalizedAlias ||
      area === `provincia de ${normalizedAlias}` ||
      area === `toda ${normalizedAlias}` ||
      area === `toda la provincia de ${normalizedAlias}` ||
      area === `comunidad de ${normalizedAlias}` ||
      area === `comunidad autonoma de ${normalizedAlias}`,
    );
  });
}

function technicianCoversLocation(tecnico: PublicTechnician, postalCode: string, municipality: string) {
  const zones = normalizeText(tecnico.work_zones);
  const normalizedMunicipality = normalizeText(municipality);
  const normalizedCity = normalizeText(tecnico.city);

  if (["toda espana", "toda espana peninsular", "nacional", "todo el territorio nacional"].some((term) => zones.includes(term))) {
    return true;
  }

  if (postalCode && zones.includes(postalCode)) return true;
  if (normalizedMunicipality && zones.includes(normalizedMunicipality)) return true;
  if (normalizedMunicipality && normalizedCity === normalizedMunicipality) return true;

  const province = /^\d{5}$/.test(postalCode) ? provinceByPostalPrefix[postalCode.slice(0, 2)] : undefined;
  if (province && provinceMentionedAsArea(tecnico.work_zones, province)) return true;

  return false;
}

async function getVerifiedTechnicians(): Promise<PublicTechnician[]> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) return [];

  const select = [
    "id",
    "name",
    "city",
    "province",
    "qualification",
    "years_experience",
    "work_zones",
    "travel_radius_km",
    "price_from_eur",
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
  const municipality = firstParam(params.municipio).trim().slice(0, 100);
  const hasSearch = /^\d{5}$/.test(postalCode) && municipality.length > 0;

  const allTechnicians = hasSearch ? await getVerifiedTechnicians() : [];
  const tecnicos = hasSearch
    ? allTechnicians.filter((tecnico) => technicianCoversLocation(tecnico, postalCode, municipality))
    : [];

  const query = new URLSearchParams();
  if (postalCode) query.set("cp", postalCode);
  if (municipality) query.set("municipio", municipality);
  const locationQuery = query.toString();
  const locationSuffix = locationQuery ? `?${locationQuery}` : "";

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Técnicos verificados</span>
          <h1>Encuentra profesionales que trabajen en tu zona.</h1>
          <p>
            Indica dónde está el inmueble. Te mostraremos los técnicos verificados que han indicado trabajar en esa zona y tú eliges el que prefieras.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <form action="/tecnicos" method="get" className="location-search-card">
            <div className="location-search-copy">
              <span className="eyebrow">Ubicación del inmueble</span>
              <h2>¿Dónde necesitas el certificado?</h2>
              <p>Usamos estos datos únicamente para enseñarte profesionales que cubren esa zona.</p>
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
                  defaultValue={postalCode}
                  placeholder="28001"
                  required
                />
              </div>
              <div className="field location-search-municipality">
                <label htmlFor="search-municipio">Municipio *</label>
                <input
                  id="search-municipio"
                  name="municipio"
                  maxLength={100}
                  defaultValue={municipality}
                  placeholder="Ej. Rivas-Vaciamadrid"
                  required
                />
              </div>
              <button type="submit" className="button location-search-button">Ver técnicos disponibles</button>
            </div>
          </form>

          {!hasSearch ? (
            <div className="location-search-empty">
              <strong>Primero indica la ubicación.</strong>
              <p>No mostramos un listado nacional indiscriminado: queremos que compares solo opciones que tengan sentido para tu inmueble.</p>
            </div>
          ) : tecnicos.length === 0 ? (
            <div className="form-card location-no-results">
              <span className="eyebrow">Sin coincidencias por ahora</span>
              <h2 style={{ fontSize: 30 }}>Todavía no tenemos un técnico verificado para {municipality}.</h2>
              <p className="lead">
                Puedes dejarnos los datos del inmueble. No te asignaremos un profesional automáticamente; podrás elegir cuando haya opciones disponibles en tu zona.
              </p>
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
            <p className="lead">Filtramos las opciones por zona para que puedas comparar y elegir con quién quieres trabajar.</p>
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
