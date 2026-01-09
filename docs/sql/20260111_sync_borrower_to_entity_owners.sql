-- Sync borrower updates into entity_owners
create or replace function public.sync_borrower_to_entity_owners()
returns trigger
language plpgsql
as $$
begin
  update public.entity_owners eo
  set
    name = new.first_name || ' ' || coalesce(new.last_name, ''),
    id_number = coalesce(new.ein, new.ssn_last4, new.id_number, eo.id_number),
    address = coalesce(
      nullif(trim(concat_ws(', ',
        new.address_line1,
        concat_ws(' ', new.city, new.state),
        new.zip
      )), ''),
      eo.address
    )
  where eo.borrower_id = new.id;
  return new;
end;
$$;

drop trigger if exists trg_sync_borrower_to_entity_owners on public.borrowers;

create trigger trg_sync_borrower_to_entity_owners
after update of first_name, last_name, ein, ssn_last4, address_line1, city, state, zip
on public.borrowers
for each row
when (new.id is not null)
execute function public.sync_borrower_to_entity_owners();

