import { NextResponse } from "next/server";
import { fetchTechnicianAvatar } from "@/lib/technician-avatar";

function supabaseHeaders(key: string) {
  const headers: Record<string, string> = { apikey: key };
  if (!key.startsWith("sb_secret_")) headers.Authorization = `Bearer ${key}`;
  return headers;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) return new NextResponse(null, { status: 404 });

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse(null, { status: 404 });

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/technician_applications?select=avatar_path&id=eq.${encodeURIComponent(id)}&limit=1`,
    { headers: supabaseHeaders(secretKey), cache: "no-store" },
  );

  if (!response.ok) return new NextResponse(null, { status: 404 });
  const rows = await response.json() as Array<{ avatar_path: string | null }>;
  const avatarPath = rows[0]?.avatar_path;
  if (!avatarPath || !avatarPath.startsWith(`${id}/`)) return new NextResponse(null, { status: 404 });

  const avatarResponse = await fetchTechnicianAvatar(avatarPath);
  if (!avatarResponse?.ok || !avatarResponse.body) return new NextResponse(null, { status: 404 });

  return new NextResponse(avatarResponse.body, {
    status: 200,
    headers: {
      "Content-Type": avatarResponse.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
