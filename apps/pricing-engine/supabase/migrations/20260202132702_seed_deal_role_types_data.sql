-- Seed deal_role_types table with roles from reference database
-- Based on existing role structure with proper display_order and allows_multiple settings

INSERT INTO public.deal_role_types (id, code, name, description, allows_multiple, display_order, is_active)
VALUES
  (1, 'borrower', 'Borrower', NULL, true, 1, true),
  (2, 'co_borrower', 'Co-Borrower', NULL, true, 2, true),
  (3, 'guarantor', 'Guarantor', NULL, true, 3, true),
  (4, 'broker', 'Broker', NULL, false, 10, true),
  (5, 'loan_processor', 'Loan Processor', NULL, false, 11, true),
  (6, 'account_executive', 'Account Executive', NULL, false, 12, true),
  (7, 'title_agent', 'Title Agent', NULL, true, 20, true),
  (8, 'escrow_agent', 'Escrow Agent', NULL, true, 21, true),
  (9, 'settlement_agent', 'Settlement Agent', NULL, true, 22, true),
  (10, 'closing_agent', 'Closing Agent', NULL, true, 23, true),
  (11, 'insurance_agent', 'Insurance Agent', NULL, true, 30, true),
  (12, 'appraiser', 'Appraiser', NULL, false, 40, true),
  (13, 'appraisal_poc', 'Appraisal POC', NULL, false, 41, true),
  (14, 'loan_buyer', 'Loan Buyer', NULL, false, 50, true),
  (15, 'balance_sheet_investor', 'Balance Sheet Investor', NULL, true, 51, true),
  (16, 'transaction_coordinator', 'Transaction Coordinator', NULL, true, 60, true),
  (17, 'point_of_contact', 'Point of Contact', NULL, true, 70, true),
  (18, 'referring_party', 'Referring Party', NULL, false, 80, true),
  (19, 'loan_opener', 'Loan Opener', 'Internal user who opens/initiates the loan', false, 19, true)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence to continue from the highest ID
SELECT setval('deal_role_types_id_seq', (SELECT MAX(id) FROM public.deal_role_types));

-- Add comment
COMMENT ON TABLE public.deal_role_types IS 'Defines roles that can be assigned to users on deals for document access control and workflow';
