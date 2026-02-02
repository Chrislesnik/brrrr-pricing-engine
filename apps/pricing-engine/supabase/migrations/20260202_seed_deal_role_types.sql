-- Seed deal_role_types table with standard roles
-- These roles are used for RBAC in document access permissions

INSERT INTO public.deal_role_types (code, name, description, allows_multiple, display_order, is_active)
VALUES
  ('admin', 'Admin', 'Full access to all documents and settings', false, 1, true),
  ('borrower', 'Borrower', 'Primary borrower on the loan application', true, 2, true),
  ('co_borrower', 'Co-Borrower', 'Additional borrower on the loan', true, 3, true),
  ('lender', 'Lender', 'Loan officer or lender representative', false, 4, true),
  ('broker', 'Broker', 'Mortgage broker facilitating the transaction', false, 5, true),
  ('title_company', 'Title Company', 'Title and escrow services', false, 6, true),
  ('appraiser', 'Appraiser', 'Property appraisal services', false, 7, true),
  ('inspector', 'Inspector', 'Property inspection services', false, 8, true),
  ('attorney', 'Attorney', 'Legal counsel', false, 9, true),
  ('viewer', 'Viewer', 'Read-only access to documents', true, 10, true)
ON CONFLICT (code) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.deal_role_types IS 'Defines roles that can be assigned to users for document access control';
