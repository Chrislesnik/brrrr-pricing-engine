-- One row per signer per Documenso document.
create table if not exists application_signings (
  id bigserial primary key,
  loan_id uuid not null references loans(id) on delete cascade,
  signer_email text not null,
  documenso_document_id text not null,
  created_at timestamptz not null default now(),
  unique (documenso_document_id, signer_email)
);

create index if not exists idx_application_signings_loan_id on application_signings (loan_id);
