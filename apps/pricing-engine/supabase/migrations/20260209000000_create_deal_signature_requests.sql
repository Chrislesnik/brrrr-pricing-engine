-- deal_signature_requests table
-- Originally created manually; converted from no-op to actual CREATE for shadow DB compatibility.

CREATE TABLE IF NOT EXISTS public.deal_signature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  documenso_document_id text NOT NULL,
  document_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined', 'expired', 'cancelled')),
  recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by_user_id text NOT NULL,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
