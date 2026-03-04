-- ============================================================================
-- Migration: Copy existing integration credentials into workflow_integrations
-- and update auto-creation trigger to use the new table.
-- ============================================================================

-- 1. Copy Floify credentials
INSERT INTO public.workflow_integrations (organization_id, user_id, type, name, config)
SELECT
  i.organization_id,
  i.user_id,
  'floify',
  NULL,
  jsonb_build_object(
    'x_api_key', COALESCE(f.x_api_key, ''),
    'user_api_key', COALESCE(f.user_api_key, ''),
    'status', i.status::text
  )
FROM public.integrations i
LEFT JOIN public.integrations_floify f ON f.integration_id = i.id
WHERE i.type = 'floify' AND i.user_id IS NOT NULL
ON CONFLICT (organization_id, user_id, type, name) DO NOTHING;

-- 2. Copy Xactus credentials
INSERT INTO public.workflow_integrations (organization_id, user_id, type, name, config)
SELECT
  i.organization_id,
  i.user_id,
  'xactus',
  NULL,
  jsonb_build_object(
    'account_user', COALESCE(x.account_user, ''),
    'account_password', COALESCE(x.account_password, ''),
    'status', i.status::text
  )
FROM public.integrations i
LEFT JOIN public.integrations_xactus x ON x.integration_id = i.id
WHERE i.type = 'xactus' AND i.user_id IS NOT NULL
ON CONFLICT (organization_id, user_id, type, name) DO NOTHING;

-- 3. Copy Clear credentials
INSERT INTO public.workflow_integrations (organization_id, user_id, type, name, config)
SELECT
  i.organization_id,
  i.user_id,
  'clear',
  NULL,
  jsonb_build_object(
    'username', COALESCE(c.username, ''),
    'password', COALESCE(c.password, ''),
    'status', i.status::text
  )
FROM public.integrations i
LEFT JOIN public.integrations_clear c ON c.integration_id = i.id
WHERE i.type = 'clear' AND i.user_id IS NOT NULL
ON CONFLICT (organization_id, user_id, type, name) DO NOTHING;

-- 4. Copy Nadlan credentials
INSERT INTO public.workflow_integrations (organization_id, user_id, type, name, config)
SELECT
  i.organization_id,
  i.user_id,
  'nadlan',
  NULL,
  jsonb_build_object(
    'username', COALESCE(n.username, ''),
    'password', COALESCE(n.password, ''),
    'status', i.status::text
  )
FROM public.integrations i
LEFT JOIN public.integrations_nadlan n ON n.integration_id = i.id
WHERE i.type = 'nadlan' AND i.user_id IS NOT NULL
ON CONFLICT (organization_id, user_id, type, name) DO NOTHING;

-- 5. Update auto-creation trigger for new org members
CREATE OR REPLACE FUNCTION public.insert_default_integrations_for_member()
  RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Insert into old integrations table (keep for backward compat until cleanup)
  INSERT INTO integrations (organization_id, user_id, type, status)
  SELECT new.organization_id, new.user_id::text, t.type, false
  FROM (VALUES ('floify'), ('xactus'), ('clear')) AS t(type)
  ON CONFLICT (organization_id, user_id, type) DO NOTHING;

  -- Also insert into new workflow_integrations table
  INSERT INTO workflow_integrations (organization_id, user_id, type, name, config)
  SELECT new.organization_id, new.user_id::text, t.type, NULL, '{}'::jsonb
  FROM (VALUES ('floify'), ('xactus'), ('clear'), ('nadlan')) AS t(type)
  ON CONFLICT (organization_id, user_id, type, name) DO NOTHING;

  RETURN new;
END;
$$;
