import { NextResponse } from "next/server";
import { getOpenApiSpec } from "@/data/openapi-spec";

const spec = getOpenApiSpec();

export function GET() {
  return NextResponse.json(spec, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
