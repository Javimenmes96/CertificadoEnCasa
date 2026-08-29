import { NextResponse } from "next/server";
import { lookupSpanishPostalCode } from "@/lib/postal";

export async function GET(
  _request: Request,
  context: { params: Promise<{ cp: string }> },
) {
  const { cp } = await context.params;
  const postalCode = cp.replace(/\D/g, "").slice(0, 5);

  if (!/^\d{5}$/.test(postalCode)) {
    return NextResponse.json({ error: "Código postal no válido." }, { status: 400 });
  }

  const lookup = await lookupSpanishPostalCode(postalCode);
  if (!lookup) {
    return NextResponse.json({ error: "No hemos encontrado ese código postal en España." }, { status: 404 });
  }

  return NextResponse.json(lookup);
}
