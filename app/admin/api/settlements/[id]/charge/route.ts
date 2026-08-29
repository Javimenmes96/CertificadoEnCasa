import { NextResponse } from "next/server";
import { chargeSettlement } from "@/lib/settlement-charging";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const result = await chargeSettlement(id);

  if (!result.ok) {
    return NextResponse.json(result, { status: 409 });
  }

  return NextResponse.json(result);
}
