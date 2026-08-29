const AVATAR_BUCKET = "technician-avatars";
const MAX_AVATAR_BYTES = 4 * 1024 * 1024;

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function getConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) return null;
  return { supabaseUrl: supabaseUrl.replace(/\/$/, ""), secretKey };
}

function authHeaders(secretKey: string, extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { apikey: secretKey, ...extra };
  if (!secretKey.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${secretKey}`;
  }
  return headers;
}

function encodeObjectPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function matchesMagicBytes(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (type === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= signature.length && signature.every((value, index) => bytes[index] === value);
  }

  if (type === "image/webp") {
    return bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }

  return false;
}

export type AvatarUploadResult =
  | { path: string }
  | { error: string; status: number }
  | null;

export async function uploadTechnicianAvatar(file: File | null, technicianId: string): Promise<AvatarUploadResult> {
  if (!file || file.size === 0) return null;

  const extension = EXTENSION_BY_TYPE[file.type];
  if (!extension) {
    return { error: "La foto debe ser JPG, PNG o WEBP.", status: 400 };
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "La foto no puede superar los 4 MB.", status: 400 };
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (!matchesMagicBytes(file.type, bytes)) {
    return { error: "El archivo seleccionado no parece una imagen válida.", status: 400 };
  }

  const config = getConfig();
  if (!config) {
    return { error: "El almacenamiento de imágenes todavía no está configurado.", status: 503 };
  }

  const path = `${technicianId}/profile.${extension}`;
  const response = await fetch(
    `${config.supabaseUrl}/storage/v1/object/${AVATAR_BUCKET}/${encodeObjectPath(path)}`,
    {
      method: "POST",
      headers: authHeaders(config.secretKey, {
        "Content-Type": file.type,
        "x-upsert": "false",
      }),
      body: buffer,
    },
  );

  if (!response.ok) {
    console.error("Technician avatar upload failed:", response.status, await response.text());
    return { error: "No hemos podido guardar la foto. Inténtalo de nuevo.", status: 500 };
  }

  return { path };
}

export async function deleteTechnicianAvatar(path: string) {
  const config = getConfig();
  if (!config || !path) return;

  try {
    const response = await fetch(
      `${config.supabaseUrl}/storage/v1/object/${AVATAR_BUCKET}/${encodeObjectPath(path)}`,
      {
        method: "DELETE",
        headers: authHeaders(config.secretKey),
      },
    );

    if (!response.ok && response.status !== 404) {
      console.error("Technician avatar cleanup failed:", response.status, await response.text());
    }
  } catch (error) {
    console.error("Technician avatar cleanup failed:", error);
  }
}

export async function fetchTechnicianAvatar(path: string) {
  const config = getConfig();
  if (!config || !path) return null;

  try {
    return await fetch(
      `${config.supabaseUrl}/storage/v1/object/${AVATAR_BUCKET}/${encodeObjectPath(path)}`,
      {
        headers: authHeaders(config.secretKey),
        cache: "no-store",
      },
    );
  } catch (error) {
    console.error("Technician avatar fetch failed:", error);
    return null;
  }
}
