-- Enable required extensions in public schema so types are available as public.vector
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA "public";
