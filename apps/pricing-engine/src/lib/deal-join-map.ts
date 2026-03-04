/**
 * Deal Join Map
 *
 * Static mapping that describes how each table can be reached from a deal_id.
 * Used by the task logic evaluation engine to build SQL queries, and by the UI
 * to show which tables are reachable.
 *
 * Two types of relationships:
 *   - "direct":   The table has a `deal_id` column.
 *   - "indirect": The table is reached through a junction/bridge table.
 */

export type DirectRelationship = {
  joinType: "direct";
  /** Column on the table that holds the deal_id (always "deal_id") */
  fkColumn: string;
};

export type IndirectRelationship = {
  joinType: "indirect";
  /** The junction table to join through */
  via: string;
  /** Column on the junction table that holds the deal_id */
  junctionDealColumn: string;
  /** Column on the junction table that references the target table's PK */
  junctionFkColumn: string;
  /** Primary key column on the target table */
  targetPkColumn: string;
};

export type DealRelationship = DirectRelationship | IndirectRelationship;

/**
 * Tables that have a direct `deal_id` column.
 */
const DIRECT_DEAL_TABLES: string[] = [
  "deals",
  "appraisal",
  "deal_borrower",
  "deal_calendar_events",
  "deal_clerk_orgs",
  "deal_comment_reads",
  "deal_comments",
  "deal_document_overrides",
  "deal_documents",
  "deal_entity",
  "deal_entity_owners",
  "deal_guarantors",
  "deal_inputs",
  "deal_property",
  "deal_roles",
  "deal_signature_requests",
  "deal_stepper",
  "deal_tasks",
  "document_files_deals",
];

/**
 * Tables that are reached indirectly through a junction table.
 */
const INDIRECT_DEAL_TABLES: Record<string, IndirectRelationship> = {
  property: {
    joinType: "indirect",
    via: "deal_property",
    junctionDealColumn: "deal_id",
    junctionFkColumn: "property_id",
    targetPkColumn: "id",
  },
  borrowers: {
    joinType: "indirect",
    via: "deal_entity_owners",
    junctionDealColumn: "deal_id",
    junctionFkColumn: "borrower_id",
    targetPkColumn: "id",
  },
  entities: {
    joinType: "indirect",
    via: "deal_entity",
    junctionDealColumn: "deal_id",
    junctionFkColumn: "entity_id",
    targetPkColumn: "id",
  },
  guarantor: {
    joinType: "indirect",
    via: "deal_guarantors",
    junctionDealColumn: "deal_id",
    junctionFkColumn: "guarantor_id",
    targetPkColumn: "id",
  },
  contact: {
    joinType: "indirect",
    via: "deal_roles",
    junctionDealColumn: "deal_id",
    junctionFkColumn: "contact_id",
    targetPkColumn: "id",
  },
  entity_owners: {
    joinType: "indirect",
    via: "deal_entity",
    junctionDealColumn: "deal_id",
    junctionFkColumn: "entity_id",
    targetPkColumn: "entity_id",
  },
  borrower_entities: {
    joinType: "indirect",
    via: "deal_borrower",
    junctionDealColumn: "deal_id",
    junctionFkColumn: "borrower_id",
    targetPkColumn: "borrower_id",
  },
};

/**
 * Get the deal relationship for a table, or null if unreachable.
 */
export function getDealRelationship(
  tableName: string
): DealRelationship | null {
  // Check direct tables
  if (DIRECT_DEAL_TABLES.includes(tableName)) {
    // For the "deals" table itself, the PK *is* the deal_id
    const fkColumn = tableName === "deals" ? "id" : "deal_id";
    return { joinType: "direct", fkColumn };
  }

  // Check indirect tables
  if (tableName in INDIRECT_DEAL_TABLES) {
    return INDIRECT_DEAL_TABLES[tableName];
  }

  return null;
}

/**
 * Check if a table is reachable from a deal.
 */
export function isTableReachable(tableName: string): boolean {
  return getDealRelationship(tableName) !== null;
}

/**
 * Get all reachable table names (direct + indirect).
 */
export function getAllReachableTables(): string[] {
  return [
    ...DIRECT_DEAL_TABLES,
    ...Object.keys(INDIRECT_DEAL_TABLES),
  ];
}

/**
 * Build a WHERE clause fragment that scopes rows to a specific deal.
 *
 * For direct tables:   "table_name"."deal_id" = $dealId
 * For indirect tables: "table_name"."pk" IN (SELECT "fk" FROM "junction" WHERE "deal_id" = $dealId)
 * For "deals" table:   "deals"."id" = $dealId
 *
 * Returns a parameterized SQL fragment + the parameter value.
 */
export function buildDealScopeClause(
  tableName: string,
  dealId: string
): { sql: string; params: string[] } | null {
  const rel = getDealRelationship(tableName);
  if (!rel) return null;

  if (rel.joinType === "direct") {
    return {
      sql: `"${tableName}"."${rel.fkColumn}" = $1`,
      params: [dealId],
    };
  }

  // Indirect: subquery through junction table
  return {
    sql: `"${tableName}"."${rel.targetPkColumn}" IN (
      SELECT "${rel.junctionFkColumn}"
      FROM "${rel.via}"
      WHERE "${rel.junctionDealColumn}" = $1
        ${rel.junctionFkColumn === "contact_id" ? `AND "${rel.junctionFkColumn}" IS NOT NULL` : ""}
    )`,
    params: [dealId],
  };
}

/**
 * Build a full SQL query to evaluate a database condition.
 *
 * @param tableName  - The table to query
 * @param column     - The column to check
 * @param operator   - SQL operator (equals, not_equals, contains, etc.)
 * @param value      - The comparison value
 * @param matchType  - "any" or "all" for multi-row handling
 * @param dealId     - The current deal ID
 *
 * Returns a complete SQL query that returns { result: boolean }.
 */
export function buildConditionQuery(
  tableName: string,
  column: string,
  operator: string,
  value: string,
  matchType: "any" | "all",
  dealId: string
): { sql: string; params: string[] } | null {
  const scopeClause = buildDealScopeClause(tableName, dealId);
  if (!scopeClause) return null;

  // Map logical operator to SQL
  const sqlOp = mapOperatorToSQL(operator, column, value);
  if (!sqlOp) return null;

  if (matchType === "any") {
    // ANY: true if at least one row matches
    return {
      sql: `SELECT EXISTS(
        SELECT 1 FROM "${tableName}"
        WHERE ${scopeClause.sql}
          AND ${sqlOp.clause}
      ) AS result`,
      params: [...scopeClause.params, ...sqlOp.params],
    };
  }

  // ALL: true if every row matches (and at least one row exists)
  return {
    sql: `SELECT (
      COUNT(*) > 0
      AND COUNT(*) = COUNT(CASE WHEN ${sqlOp.clause} THEN 1 END)
    ) AS result
    FROM "${tableName}"
    WHERE ${scopeClause.sql}`,
    params: [...scopeClause.params, ...sqlOp.params],
  };
}

/**
 * Map a logical operator name to a SQL clause fragment.
 * Parameter index starts at $2 (since $1 is used for deal_id).
 */
function mapOperatorToSQL(
  operator: string,
  column: string,
  value: string
): { clause: string; params: string[] } | null {
  const col = `"${column}"`;
  const paramIdx = "$2";

  switch (operator) {
    case "equals":
      return { clause: `${col}::text = ${paramIdx}`, params: [value] };
    case "not_equals":
      return { clause: `${col}::text != ${paramIdx}`, params: [value] };
    case "contains":
      return {
        clause: `${col}::text ILIKE ${paramIdx}`,
        params: [`%${value}%`],
      };
    case "not_contains":
      return {
        clause: `${col}::text NOT ILIKE ${paramIdx}`,
        params: [`%${value}%`],
      };
    case "starts_with":
      return {
        clause: `${col}::text ILIKE ${paramIdx}`,
        params: [`${value}%`],
      };
    case "ends_with":
      return {
        clause: `${col}::text ILIKE ${paramIdx}`,
        params: [`%${value}`],
      };
    case "greater_than":
      return {
        clause: `(${col})::numeric > (${paramIdx})::numeric`,
        params: [value],
      };
    case "less_than":
      return {
        clause: `(${col})::numeric < (${paramIdx})::numeric`,
        params: [value],
      };
    case "greater_than_or_equal":
      return {
        clause: `(${col})::numeric >= (${paramIdx})::numeric`,
        params: [value],
      };
    case "less_than_or_equal":
      return {
        clause: `(${col})::numeric <= (${paramIdx})::numeric`,
        params: [value],
      };
    case "is_empty":
      return {
        clause: `(${col} IS NULL OR ${col}::text = '')`,
        params: [],
      };
    case "is_not_empty":
      return {
        clause: `(${col} IS NOT NULL AND ${col}::text != '')`,
        params: [],
      };
    case "is_true":
      return { clause: `${col}::boolean = true`, params: [] };
    case "is_false":
      return { clause: `${col}::boolean = false`, params: [] };
    default:
      return { clause: `${col}::text = ${paramIdx}`, params: [value] };
  }
}
