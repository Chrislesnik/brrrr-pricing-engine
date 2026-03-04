import type { IntegrationPlugin } from "../registry";
import { registerIntegration } from "../registry";
import { SupabaseIcon } from "./icon";

const supabasePlugin: IntegrationPlugin = {
  type: "supabase",
  label: "Supabase",
  description: "Database, storage, and edge functions powered by Supabase",

  icon: SupabaseIcon,

  formFields: [
    {
      id: "supabaseUrl",
      label: "Supabase URL (Optional)",
      type: "text",
      placeholder: "https://your-project.supabase.co (leave blank to use this project)",
      configKey: "supabaseUrl",
      envVar: "SUPABASE_URL",
      helpText: "Leave blank to use this project's database",
    },
    {
      id: "supabaseKey",
      label: "Service Role Key (Optional)",
      type: "password",
      placeholder: "eyJ... (leave blank to use this project)",
      configKey: "supabaseKey",
      envVar: "SUPABASE_SERVICE_ROLE_KEY",
      helpText: "Required only for external Supabase projects",
    },
  ],

  testConfig: {
    getTestFunction: async () => {
      const { testSupabase } = await import("./test");
      return testSupabase;
    },
  },

  actions: [
    // ── Read Operations ──
    {
      slug: "get-row",
      label: "Get Row",
      description: "Fetch a single row from a Supabase table by column value",
      category: "Supabase",
      stepFunction: "supabaseGetRowStep",
      stepImportPath: "get-row",
      outputFields: [
        { field: "row", description: "The matched row object" },
        { field: "found", description: "Whether a row was found (true/false)" },
      ],
      configFields: [
        {
          key: "table",
          label: "Table",
          type: "supabase-table",
          placeholder: "Select a table...",
          required: true,
        },
        {
          key: "lookupColumn",
          label: "Lookup Column",
          type: "supabase-column",
          placeholder: "Select a column...",
          required: true,
        },
        {
          key: "lookupValue",
          label: "Lookup Value",
          type: "template-input",
          placeholder: "e.g. {{Trigger.id}} or a specific value",
          required: true,
        },
        {
          key: "outputSchema",
          label: "Output Schema",
          type: "supabase-schema-builder",
          placeholder: "",
        },
      ],
    },
    {
      slug: "get-many",
      label: "Get Many",
      description: "Query multiple rows with filters, ordering, and limits",
      category: "Supabase",
      stepFunction: "supabaseGetManyStep",
      stepImportPath: "get-many",
      outputFields: [
        { field: "rows", description: "Array of matching rows" },
        { field: "count", description: "Number of rows returned" },
      ],
      configFields: [
        {
          key: "table",
          label: "Table",
          type: "supabase-table",
          placeholder: "Select a table...",
          required: true,
        },
        {
          key: "filterMatch",
          label: "Filter Match",
          type: "select",
          defaultValue: "and",
          options: [
            { value: "and", label: "All conditions must match (AND)" },
            { value: "or", label: "Any condition can match (OR)" },
          ],
        },
        {
          key: "filters",
          label: "Filters",
          type: "supabase-filter-builder",
          placeholder: "",
        },
        {
          key: "returnAll",
          label: "Return All Rows",
          type: "toggle",
          defaultValue: "false",
        },
        {
          key: "limit",
          label: "Limit",
          type: "number",
          defaultValue: "50",
          min: 1,
          showWhen: {
            field: "returnAll",
            equals: "false",
          },
        },
        {
          key: "orderBy",
          label: "Order By",
          type: "supabase-column",
          placeholder: "Select a column...",
        },
        {
          key: "orderDirection",
          label: "Order Direction",
          type: "select",
          defaultValue: "desc",
          options: [
            { value: "asc", label: "Ascending" },
            { value: "desc", label: "Descending" },
          ],
        },
        {
          key: "outputSchema",
          label: "Output Schema",
          type: "supabase-schema-builder",
          placeholder: "",
        },
      ],
    },
    {
      slug: "insert",
      label: "Insert Row",
      description: "Insert a new row into a Supabase table",
      category: "Supabase",
      stepFunction: "supabaseInsertStep",
      stepImportPath: "insert",
      outputFields: [
        { field: "row", description: "The inserted row" },
        { field: "id", description: "ID of the inserted row" },
      ],
      configFields: [
        {
          key: "table",
          label: "Table",
          type: "supabase-table",
          placeholder: "Select a table...",
          required: true,
        },
        {
          key: "data",
          label: "Row Data (JSON)",
          type: "template-textarea",
          placeholder: '{"name": "John", "status": "active"} or {{NodeName.output}}',
          rows: 5,
          required: true,
        },
      ],
    },
    {
      slug: "update",
      label: "Update Rows",
      description: "Update rows in a Supabase table matching a filter",
      category: "Supabase",
      stepFunction: "supabaseUpdateStep",
      stepImportPath: "update",
      outputFields: [
        { field: "rows", description: "The updated rows" },
        { field: "count", description: "Number of rows updated" },
      ],
      configFields: [
        {
          key: "table",
          label: "Table",
          type: "supabase-table",
          placeholder: "Select a table...",
          required: true,
        },
        {
          key: "data",
          label: "Update Data (JSON)",
          type: "template-textarea",
          placeholder: '{"status": "closed"} or {{NodeName.output}}',
          rows: 4,
          required: true,
        },
        {
          key: "filterColumn",
          label: "Filter Column",
          type: "template-input",
          placeholder: "e.g. id or status",
          required: true,
        },
        {
          key: "filterOperator",
          label: "Filter Operator",
          type: "select",
          defaultValue: "eq",
          options: [
            { value: "eq", label: "Equals (eq)" },
            { value: "neq", label: "Not Equals (neq)" },
            { value: "gt", label: "Greater Than (gt)" },
            { value: "lt", label: "Less Than (lt)" },
            { value: "in", label: "In (comma-separated)" },
          ],
        },
        {
          key: "filterValue",
          label: "Filter Value",
          type: "template-input",
          placeholder: "e.g. {{Trigger.id}}",
          required: true,
        },
      ],
    },
    {
      slug: "delete",
      label: "Delete Rows",
      description: "Delete rows from a Supabase table matching a filter",
      category: "Supabase",
      stepFunction: "supabaseDeleteStep",
      stepImportPath: "delete",
      outputFields: [
        { field: "count", description: "Number of rows deleted" },
      ],
      configFields: [
        {
          key: "table",
          label: "Table",
          type: "supabase-table",
          placeholder: "Select a table...",
          required: true,
        },
        {
          key: "filterColumn",
          label: "Filter Column",
          type: "template-input",
          placeholder: "e.g. id",
          required: true,
        },
        {
          key: "filterOperator",
          label: "Filter Operator",
          type: "select",
          defaultValue: "eq",
          options: [
            { value: "eq", label: "Equals (eq)" },
            { value: "in", label: "In (comma-separated)" },
          ],
        },
        {
          key: "filterValue",
          label: "Filter Value",
          type: "template-input",
          placeholder: "e.g. {{Trigger.id}}",
          required: true,
        },
      ],
    },

    // ── Advanced Operations ──
    {
      slug: "rpc",
      label: "Call Function",
      description: "Execute a Postgres/Supabase RPC function",
      category: "Supabase",
      stepFunction: "supabaseRpcStep",
      stepImportPath: "rpc",
      outputFields: [
        { field: "result", description: "Function return value" },
      ],
      configFields: [
        {
          key: "functionName",
          label: "Function Name",
          type: "template-input",
          placeholder: "e.g. get_deal_summary",
          required: true,
        },
        {
          key: "params",
          label: "Parameters (JSON)",
          type: "template-textarea",
          placeholder: '{"deal_id": "{{Trigger.id}}"} or {}',
          rows: 4,
          defaultValue: "{}",
        },
      ],
    },
    {
      slug: "raw-sql",
      label: "Raw SQL",
      description: "Execute an arbitrary SQL query against the database",
      category: "Supabase",
      stepFunction: "supabaseRawSqlStep",
      stepImportPath: "raw-sql",
      outputFields: [
        { field: "rows", description: "Query result rows" },
        { field: "count", description: "Number of rows returned" },
      ],
      configFields: [
        {
          key: "query",
          label: "SQL Query",
          type: "template-textarea",
          placeholder: "SELECT * FROM deals WHERE status = 'active' LIMIT 10",
          rows: 6,
          required: true,
        },
      ],
    },
    {
      slug: "storage",
      label: "Storage",
      description: "Upload, download, or list files in Supabase Storage",
      category: "Supabase",
      stepFunction: "supabaseStorageStep",
      stepImportPath: "storage",
      outputFields: [
        { field: "result", description: "Operation result (URL, file list, or confirmation)" },
      ],
      configFields: [
        {
          key: "operation",
          label: "Operation",
          type: "select",
          defaultValue: "list",
          options: [
            { value: "list", label: "List Files" },
            { value: "upload", label: "Upload File" },
            { value: "download", label: "Get Public URL" },
            { value: "remove", label: "Delete File" },
          ],
          required: true,
        },
        {
          key: "bucket",
          label: "Bucket",
          type: "template-input",
          placeholder: "e.g. documents, avatars",
          required: true,
        },
        {
          key: "path",
          label: "File Path",
          type: "template-input",
          placeholder: "e.g. uploads/report.pdf or {{NodeName.path}}",
        },
        {
          key: "fileContent",
          label: "File Content (for upload)",
          type: "template-textarea",
          placeholder: "Base64 encoded content or text content",
          rows: 3,
        },
      ],
    },
    {
      slug: "edge-function",
      label: "Edge Function",
      description: "Invoke a Supabase Edge Function",
      category: "Supabase",
      stepFunction: "supabaseEdgeFunctionStep",
      stepImportPath: "edge-function",
      outputFields: [
        { field: "data", description: "Response data from the Edge Function" },
        { field: "status", description: "HTTP status code" },
      ],
      configFields: [
        {
          key: "functionName",
          label: "Function Name",
          type: "template-input",
          placeholder: "e.g. process-document",
          required: true,
        },
        {
          key: "body",
          label: "Request Body (JSON)",
          type: "template-textarea",
          placeholder: '{"key": "value"} or {{NodeName.output}}',
          rows: 4,
          defaultValue: "{}",
        },
        {
          key: "method",
          label: "HTTP Method",
          type: "select",
          defaultValue: "POST",
          options: [
            { value: "POST", label: "POST" },
            { value: "GET", label: "GET" },
          ],
        },
      ],
    },
  ],
};

// Auto-register on import
registerIntegration(supabasePlugin);

export default supabasePlugin;
