import { BIN_CAPACITY_KG, INITIAL_BINS } from "@/lib/bins";
import { addReading, listReadings } from "@/lib/readings";

/** Webhook + dashboard read model: POST { binId, weightKg } to record, GET to list. */
export async function GET() {
  return Response.json({ readings: listReadings() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    binId?: unknown;
    weightKg?: unknown;
  } | null;

  const binId = body?.binId;
  if (typeof binId !== "string" || !INITIAL_BINS.some((b) => b.id === binId)) {
    return Response.json({ error: "Unknown binId." }, { status: 400 });
  }
  const weightKg = Number(body?.weightKg);
  if (!Number.isFinite(weightKg) || weightKg < 0 || weightKg > BIN_CAPACITY_KG) {
    return Response.json({ error: `weightKg must be 0–${BIN_CAPACITY_KG}.` }, { status: 400 });
  }

  const reading = addReading({
    binId,
    weightKg: Math.round(weightKg * 100) / 100,
    at: new Date().toISOString(),
    source: "manual",
  });
  return Response.json({ reading }, { status: 201 });
}
