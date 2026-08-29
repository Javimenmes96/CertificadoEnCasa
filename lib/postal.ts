export type PostalPlace = {
  municipality: string;
  province: string;
};

export type PostalLookup = {
  postalCode: string;
  places: PostalPlace[];
};

type ZippopotamResponse = {
  "post code"?: string;
  places?: Array<{
    "place name"?: string;
    state?: string;
  }>;
};

export function normalizePlace(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export async function lookupSpanishPostalCode(postalCode: string): Promise<PostalLookup | null> {
  if (!/^\d{5}$/.test(postalCode)) return null;

  try {
    const response = await fetch(`https://api.zippopotam.us/ES/${postalCode}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;

    const data = await response.json() as ZippopotamResponse;
    const seen = new Set<string>();
    const places: PostalPlace[] = [];

    for (const place of data.places || []) {
      const municipality = (place["place name"] || "").trim();
      const province = (place.state || "").trim();
      if (!municipality) continue;

      const key = `${normalizePlace(municipality)}|${normalizePlace(province)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      places.push({ municipality, province });
    }

    if (places.length === 0) return null;
    return { postalCode, places };
  } catch (error) {
    console.error("Postal code lookup failed:", error);
    return null;
  }
}

export function findPostalPlace(lookup: PostalLookup | null, municipality: string) {
  if (!lookup) return null;
  const wanted = normalizePlace(municipality);
  if (!wanted) return null;
  return lookup.places.find((place) => normalizePlace(place.municipality) === wanted) || null;
}
