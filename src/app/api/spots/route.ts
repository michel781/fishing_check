import { NextResponse } from "next/server";
import { SPOTS, SPOT_TYPE_LABEL } from "@/data/spots";

export function GET() {
  return NextResponse.json(
    SPOTS.map((s) => ({ id: s.id, name: s.name, area: s.area, sea: s.sea, type: s.type, typeLabel: SPOT_TYPE_LABEL[s.type], lat: s.lat, lon: s.lon, species: s.species })),
  );
}
