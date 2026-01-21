-- Create pricing_activity_log table for tracking pricing page activity
-- Tracks: input changes, user assignments, term sheet downloads/shares

CREATE TABLE IF NOT EXISTS pricing_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES loan_scenarios(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('input_changes', 'user_assignment', 'term_sheet')),
  action TEXT NOT NULL CHECK (action IN ('changed', 'added', 'deleted', 'downloaded', 'shared')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT NOT NULL,
  inputs JSONB,
  outputs JSONB,
  selected JSONB,
  term_sheet_original_path TEXT,
  term_sheet_edit_path TEXT,
  assigned_to_changes TEXT[]
);

-- Add comment describing the table
COMMENT ON TABLE pricing_activity_log IS 'Tracks activity on pricing pages including input changes, user assignments, and term sheet actions';

-- Column comments
COMMENT ON COLUMN pricing_activity_log.activity_type IS 'Type of activity: input_changes, user_assignment, or term_sheet';
COMMENT ON COLUMN pricing_activity_log.action IS 'Action performed: changed, added, deleted, downloaded, or shared';
COMMENT ON COLUMN pricing_activity_log.user_id IS 'Clerk user ID who performed the action';
COMMENT ON COLUMN pricing_activity_log.inputs IS 'All pricing page input values at time of action';
COMMENT ON COLUMN pricing_activity_log.outputs IS 'Full program webhook responses (rates, fees, eligibility)';
COMMENT ON COLUMN pricing_activity_log.selected IS 'Which program row was selected, term sheet options';
COMMENT ON COLUMN pricing_activity_log.term_sheet_original_path IS 'Storage path for PDF without orange box edits';
COMMENT ON COLUMN pricing_activity_log.term_sheet_edit_path IS 'Storage path for PDF with orange box edits';
COMMENT ON COLUMN pricing_activity_log.assigned_to_changes IS 'Array of user IDs added/removed in assignment actions';

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_pricing_activity_log_loan_id ON pricing_activity_log(loan_id);
CREATE INDEX IF NOT EXISTS idx_pricing_activity_log_scenario_id ON pricing_activity_log(scenario_id);
CREATE INDEX IF NOT EXISTS idx_pricing_activity_log_created_at ON pricing_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_activity_log_user_id ON pricing_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_pricing_activity_log_activity_type ON pricing_activity_log(activity_type);

-- Enable RLS
ALTER TABLE pricing_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can SELECT logs where they are the user_id OR are assigned to the loan
CREATE POLICY "Users can view their own activity logs"
  ON pricing_activity_log
  FOR SELECT
  USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR loan_id IN (
      SELECT id FROM loans 
      WHERE assigned_to_user_id ? (current_setting('request.jwt.claims', true)::json->>'sub')::text
    )
  );

-- RLS Policy: Users can INSERT logs for loans they have access to
CREATE POLICY "Users can insert activity logs for accessible loans"
  ON pricing_activity_log
  FOR INSERT
  WITH CHECK (
    loan_id IN (
      SELECT id FROM loans WHERE organization_id IN (
        SELECT id FROM organizations WHERE clerk_organization_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::text
      )
    )
  );

-- Create term-sheets storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'term-sheets',
  'term-sheets',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Users can upload term sheets for their organization's loans
CREATE POLICY "Users can upload term sheets"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'term-sheets'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations 
      WHERE clerk_organization_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::text
    )
  );

-- Storage RLS: Users can view term sheets for their organization's loans
CREATE POLICY "Users can view term sheets"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'term-sheets'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations 
      WHERE clerk_organization_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::text
    )
  );

-- Storage RLS: Users can delete term sheets for their organization's loans
CREATE POLICY "Users can delete term sheets"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'term-sheets'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations 
      WHERE clerk_organization_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::text
    )
  );
