-- Create auth_clerk_orgs table to map Clerk organization IDs to internal org PKs
CREATE TABLE IF NOT EXISTS public.auth_clerk_orgs (
    id SERIAL PRIMARY KEY,
    clerk_org_id TEXT NOT NULL UNIQUE,
    org_name TEXT,
    org_slug TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.auth_clerk_orgs IS 'Maps Clerk organization IDs to internal organization primary keys';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_auth_clerk_orgs_clerk_org_id ON public.auth_clerk_orgs(clerk_org_id);

-- Enable RLS
ALTER TABLE public.auth_clerk_orgs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Allow authenticated users to read organizations they belong to
CREATE POLICY "Users can read their own organizations"
    ON public.auth_clerk_orgs
    FOR SELECT
    TO authenticated
    USING (
        -- Allow if the JWT contains this org_id in the claims
        clerk_org_id = (auth.jwt() -> 'org_id')::text
        OR
        -- Or if the user has a specific role (admin bypass)
        (auth.jwt() -> 'user_metadata' -> 'role')::text = 'admin'
    );

-- Create RLS policy: Allow service role to manage all organizations
CREATE POLICY "Service role can manage all organizations"
    ON public.auth_clerk_orgs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create function to automatically sync Clerk orgs on first access
CREATE OR REPLACE FUNCTION public.upsert_clerk_org(
    p_clerk_org_id TEXT,
    p_org_name TEXT DEFAULT NULL,
    p_org_slug TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_id INTEGER;
BEGIN
    -- Insert or update the organization
    INSERT INTO public.auth_clerk_orgs (clerk_org_id, org_name, org_slug, updated_at)
    VALUES (p_clerk_org_id, p_org_name, p_org_slug, NOW())
    ON CONFLICT (clerk_org_id)
    DO UPDATE SET
        org_name = COALESCE(EXCLUDED.org_name, auth_clerk_orgs.org_name),
        org_slug = COALESCE(EXCLUDED.org_slug, auth_clerk_orgs.org_slug),
        updated_at = NOW()
    RETURNING id INTO v_org_id;
    
    RETURN v_org_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.upsert_clerk_org TO authenticated;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_auth_clerk_orgs_updated_at
    BEFORE UPDATE ON public.auth_clerk_orgs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
