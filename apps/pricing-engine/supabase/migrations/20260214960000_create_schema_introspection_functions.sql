-- Function to list all public tables
CREATE OR REPLACE FUNCTION public.list_public_tables()
RETURNS TABLE(table_name text) 
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
$$;

-- Function to list columns for a given table
CREATE OR REPLACE FUNCTION public.list_table_columns(p_table_name text)
RETURNS TABLE(column_name text, data_type text, is_nullable boolean)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT c.column_name::text, c.data_type::text, (c.is_nullable = 'YES')
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = p_table_name
  ORDER BY c.ordinal_position;
$$;

-- Function to list public RPC functions
CREATE OR REPLACE FUNCTION public.list_public_functions()
RETURNS TABLE(function_name text, function_args text)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT p.proname::text, pg_get_function_arguments(p.oid)::text
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind = 'f'
  ORDER BY p.proname
  LIMIT 200;
$$;

-- Grant execute to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.list_public_tables() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_table_columns(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_public_functions() TO authenticated, service_role;
