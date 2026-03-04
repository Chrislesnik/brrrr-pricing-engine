import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDealRelationship } from "@/lib/deal-join-map";

/**
 * GET /api/task-logic-rules/table-info?table=property
 *
 * Returns join reachability info for a given table relative to a deal.
 * Used by the logic builder UI to show which tables can be used in conditions.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tableName = request.nextUrl.searchParams.get("table");
    if (!tableName) {
      return NextResponse.json(
        { error: "table parameter required" },
        { status: 400 }
      );
    }

    const relationship = getDealRelationship(tableName);

    if (!relationship) {
      return NextResponse.json({
        reachable: false,
        joinType: null,
        via: null,
        fk: null,
      });
    }

    if (relationship.joinType === "direct") {
      return NextResponse.json({
        reachable: true,
        joinType: "direct",
        via: null,
        fk: relationship.fkColumn,
      });
    }

    return NextResponse.json({
      reachable: true,
      joinType: "indirect",
      via: relationship.via,
      fk: relationship.junctionFkColumn,
    });
  } catch (error) {
    console.error("[GET /api/task-logic-rules/table-info]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
