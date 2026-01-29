


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."borrowers_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end $$;


ALTER FUNCTION "public"."borrowers_set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_floify_integration"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_type text;
begin
  select type into v_type from integrations where id = new.integration_id;
  if v_type is null then
    raise exception 'integration % not found', new.integration_id;
  end if;
  if v_type <> 'floify' then
    raise exception 'integration % is type %, expected floify', new.integration_id, v_type;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."ensure_floify_integration"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_user_chat"("p_report_id" "uuid", "p_org_id" "uuid", "p_user_id" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_chat_id uuid;
begin
  if p_report_id is null or p_user_id is null then
    return;
  end if;

  -- If mapping already exists, nothing to do
  select chat_id into v_chat_id
  from public.credit_report_user_chats
  where report_id = p_report_id and user_id = p_user_id;

  if v_chat_id is not null then
    return;
  end if;

  -- Reuse most recent chat for this user/org, otherwise create one
  select id into v_chat_id
  from public.credit_report_chats
  where user_id = p_user_id and organization_id = p_org_id
  order by created_at desc
  limit 1;

  if v_chat_id is null then
    insert into public.credit_report_chats (user_id, organization_id, name)
    values (p_user_id, p_org_id, 'Credit report chat')
    returning id into v_chat_id;
  end if;

  insert into public.credit_report_user_chats (report_id, user_id, chat_id)
  values (p_report_id, p_user_id, v_chat_id)
  on conflict (report_id, user_id) do update
  set chat_id = excluded.chat_id;
end;
$$;


ALTER FUNCTION "public"."ensure_user_chat"("p_report_id" "uuid", "p_org_id" "uuid", "p_user_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."entities_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end $$;


ALTER FUNCTION "public"."entities_set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_default_integrations_for_member"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into integrations (organization_id, user_id, type, status)
  select new.organization_id, new.user_id::text, t.type, false
  from (values ('floify'), ('xactus'), ('clear')) as t(type)
  on conflict (organization_id, user_id, type) do nothing;
  return new;
end;
$$;


ALTER FUNCTION "public"."insert_default_integrations_for_member"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer DEFAULT NULL::integer, "filter" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("id" bigint, "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;


ALTER FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_program_chunks"("p_program_id" "uuid", "p_query_embedding" "public"."vector", "p_match_count" integer DEFAULT 8, "p_min_cosine_sim" double precision DEFAULT 0) RETURNS TABLE("document_id" "uuid", "chunk_index" integer, "content" "text", "cosine_sim" double precision)
    LANGUAGE "sql" STABLE
    AS $$
  select
    dc.document_id,
    dc.chunk_index,
    dc.content,
    1 - (dc.embedding <-> p_query_embedding) as cosine_sim  -- vector_cosine_ops makes <-> = cosine distance
  from public.document_chunks dc
  join public.program_documents d on d.id = dc.document_id
  where d.program_id = p_program_id
  order by dc.embedding <-> p_query_embedding
  limit greatest(p_match_count, 1)
$$;


ALTER FUNCTION "public"."match_program_chunks"("p_program_id" "uuid", "p_query_embedding" "public"."vector", "p_match_count" integer, "p_min_cosine_sim" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_custom_broker_settings_from_default"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  d record;
begin
  -- if no member yet, do nothing; will seed when member is attached
  if NEW.organization_member_id is null then
    return NEW;
  end if;

  select * into d
  from public.default_broker_settings
  where organization_id = NEW.organization_id
    and organization_member_id = NEW.organization_member_id;

  if d is null then
    insert into public.custom_broker_settings (
      organization_id, organization_member_id, broker_id,
      allow_ysp, allow_buydown_rate, program_visibility, rates, created_at, updated_at
    )
    values (
      NEW.organization_id, NEW.organization_member_id, NEW.id,
      false, false, '{}'::jsonb, '[]'::jsonb, now(), now()
    )
    on conflict (organization_id, broker_id) do nothing;
  else
    insert into public.custom_broker_settings (
      organization_id, organization_member_id, broker_id,
      allow_ysp, allow_buydown_rate, program_visibility, rates
    )
    values (
      NEW.organization_id, NEW.organization_member_id, NEW.id,
      coalesce(d.allow_ysp, false),
      coalesce(d.allow_buydown_rate, false),
      coalesce(d.program_visibility, '{}'::jsonb),
      coalesce(d.rates, '[]'::jsonb)
    )
    on conflict (organization_id, broker_id) do nothing;
  end if;

  return NEW;
end
$$;


ALTER FUNCTION "public"."seed_custom_broker_settings_from_default"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_custom_broker_settings_on_member_attach"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  d record;
begin
  if NEW.organization_member_id is null then
    return NEW;
  end if;

  -- already has custom settings? do nothing
  if exists (
    select 1 from public.custom_broker_settings c
    where c.broker_id = NEW.id
  ) then
    return NEW;
  end if;

  -- try defaults, else blank
  select * into d
  from public.default_broker_settings
  where organization_id = NEW.organization_id
    and organization_member_id = NEW.organization_member_id;

  if d is null then
    insert into public.custom_broker_settings (
      organization_id, organization_member_id, broker_id,
      allow_ysp, allow_buydown_rate, program_visibility, rates, created_at, updated_at
    )
    values (
      NEW.organization_id, NEW.organization_member_id, NEW.id,
      false, false, '{}'::jsonb, '[]'::jsonb, now(), now()
    )
    on conflict (organization_id, broker_id) do nothing;
  else
    insert into public.custom_broker_settings (
      organization_id, organization_member_id, broker_id,
      allow_ysp, allow_buydown_rate, program_visibility, rates
    )
    values (
      NEW.organization_id, NEW.organization_member_id, NEW.id,
      coalesce(d.allow_ysp, false),
      coalesce(d.allow_buydown_rate, false),
      coalesce(d.program_visibility, '{}'::jsonb),
      coalesce(d.rates, '[]'::jsonb)
    )
    on conflict (organization_id, broker_id) do nothing;
  end if;

  return NEW;
end
$$;


ALTER FUNCTION "public"."seed_custom_broker_settings_on_member_attach"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end; $$;


ALTER FUNCTION "public"."set_current_timestamp_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_programs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end$$;


ALTER FUNCTION "public"."set_programs_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_application_from_primary_scenario"("p_loan_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare
begin
  -- Ensure an application row exists for this loan
  insert into public.applications (loan_id, organization_id, borrower_name, status)
  select l.id,
         l.organization_id,
         nullif(trim(concat_ws(' ', l.borrower_first_name, l.borrower_last_name)), ''),
         'draft'
  from public.loans l
  where l.id = p_loan_id
    and not exists (select 1 from public.applications a where a.loan_id = p_loan_id);

  -- Sync fields from the current primary scenario
  with primary_scenario as (
    select ls.borrower_entity_id,
           ls.guarantor_borrower_ids,
           ls.guarantor_names,
           ls.guarantor_emails,
           ls.inputs->'address'->>'street' as property_street,
           ls.inputs->'address'->>'city' as property_city,
           ls.inputs->'address'->>'state' as property_state,
           ls.inputs->'address'->>'zip' as property_zip,
           ls.inputs->>'borrower_name' as borrower_name,
           ls.inputs->'guarantors' as guarantor_names_json
    from public.loan_scenarios ls
    where ls.loan_id = p_loan_id
      and coalesce(ls.primary, false) = true
    order by ls.created_at desc nulls last, ls.id desc
    limit 1
  ),
  src as (
    select
      borrower_entity_id,
      guarantor_borrower_ids,
      case when guarantor_names is not null then guarantor_names
           when guarantor_names_json is not null then array(select jsonb_array_elements_text(guarantor_names_json))
           else null end as guarantor_names_array,
      guarantor_emails,
      property_street,
      property_city,
      property_state,
      property_zip,
      borrower_name
    from primary_scenario
    union all
    select null::uuid as borrower_entity_id,
           null::uuid[] as guarantor_borrower_ids,
           null::text[] as guarantor_names_array,
           null::text[] as guarantor_emails,
           null::text as property_street,
           null::text as property_city,
           null::text as property_state,
           null::text as property_zip,
           null::text as borrower_name
    where not exists (select 1 from primary_scenario)
    limit 1
  )
  update public.applications a
  set entity_id = src.borrower_entity_id,
      guarantor_ids = src.guarantor_borrower_ids,
      guarantor_names = src.guarantor_names_array,
      guarantor_emails = src.guarantor_emails,
      property_street = src.property_street,
      property_city = src.property_city,
      property_state = src.property_state,
      property_zip = src.property_zip,
      borrower_name = src.borrower_name
  from src
  where a.loan_id = p_loan_id;
end;
$$;


ALTER FUNCTION "public"."sync_application_from_primary_scenario"("p_loan_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_assigned_from_viewers_del"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update public.credit_reports r
  set assigned_to = array_remove(r.assigned_to, OLD.user_id)
  where r.id = OLD.report_id;
  return OLD;
end;
$$;


ALTER FUNCTION "public"."sync_assigned_from_viewers_del"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_assigned_from_viewers_ins"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update public.credit_reports r
  set assigned_to = (
    select array_agg(distinct x)
    from unnest(coalesce(r.assigned_to, '{}'::text[]) || array[NEW.user_id]) as t(x)
  )
  where r.id = NEW.report_id;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."sync_assigned_from_viewers_ins"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_borrower_to_entity_owners"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update public.entity_owners eo
  set
    name = new.first_name || ' ' || coalesce(new.last_name, ''),
    id_number = coalesce(new.ssn_last4, eo.id_number),
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


ALTER FUNCTION "public"."sync_borrower_to_entity_owners"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_primary_scenario_from_application"("p_loan_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare
  primary_scenario_id uuid;
  app record;
  inputs_json jsonb;
begin
  select id into primary_scenario_id
  from public.loan_scenarios
  where loan_id = p_loan_id and coalesce("primary",false) = true
  order by created_at desc nulls last, id desc
  limit 1;

  if primary_scenario_id is null then
    return;
  end if;

  select * into app from public.applications where loan_id = p_loan_id limit 1;
  if not found then
    return;
  end if;

  -- Build updated inputs jsonb (preserve existing keys, overwrite borrower_name/guarantors)
  select inputs into inputs_json from public.loan_scenarios where id = primary_scenario_id;
  inputs_json := coalesce(inputs_json, '{}'::jsonb);

  -- borrower name
  if app.borrower_name is not null then
    inputs_json := jsonb_set(inputs_json, '{borrower_name}', to_jsonb(app.borrower_name), true);
  end if;

  -- guarantors: store names only in inputs snapshot (emails stay in applications)
  if app.guarantor_names is not null then
    inputs_json := jsonb_set(inputs_json, '{guarantors}', to_jsonb(app.guarantor_names), true);
  end if;

  update public.loan_scenarios
  set borrower_entity_id = app.entity_id,
      guarantor_borrower_ids = app.guarantor_ids,
      guarantor_names = app.guarantor_names,
      inputs = inputs_json
  where id = primary_scenario_id;
end;
$$;


ALTER FUNCTION "public"."sync_primary_scenario_from_application"("p_loan_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_viewers_from_credit_reports"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- insert missing viewers for each assigned user
  insert into public.credit_report_viewers (report_id, user_id)
  select NEW.id, t.user_id
  from unnest(coalesce(NEW.assigned_to, '{}'::text[])) as t(user_id)
  on conflict (report_id, user_id) do nothing;

  -- delete viewers that are no longer assigned
  delete from public.credit_report_viewers v
  where v.report_id = NEW.id
    and not (v.user_id = any(coalesce(NEW.assigned_to, '{}'::text[])));

  return NEW;
end;
$$;


ALTER FUNCTION "public"."sync_viewers_from_credit_reports"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_ai_chat_last_used"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update public.ai_chats
     set last_used_at = now()
   where id = new.ai_chat_id;
  return new;
end;
$$;


ALTER FUNCTION "public"."touch_ai_chat_last_used"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_credit_report_chat_last_used"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update public.credit_report_chats
     set last_used_at = now()
   where id = new.credit_report_chat_id;
  return new;
end;
$$;


ALTER FUNCTION "public"."touch_credit_report_chat_last_used"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_applications_sync_from_primary_scenario"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.loan_id is not null then
    perform public.sync_application_from_primary_scenario(new.loan_id);
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."trg_applications_sync_from_primary_scenario"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_applications_sync_primary_scenario"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.loan_id is not null then
    perform public.sync_primary_scenario_from_application(new.loan_id);
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."trg_applications_sync_primary_scenario"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_loan_scenarios_sync_applications"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  affected_old uuid;
  affected_new uuid;
  needs_new boolean := false;
  needs_old boolean := false;
begin
  if tg_op = 'INSERT' then
    affected_new := new.loan_id;
    needs_new := true;
  elsif tg_op = 'UPDATE' then
    affected_new := new.loan_id;
    affected_old := old.loan_id;

    if affected_new is distinct from affected_old then
      needs_old := affected_old is not null;
      needs_new := affected_new is not null;
    end if;

    if coalesce(new.primary, false) is distinct from coalesce(old.primary, false)
       or new.borrower_entity_id is distinct from old.borrower_entity_id
       or new.guarantor_borrower_ids is distinct from old.guarantor_borrower_ids
       or new.guarantor_names is distinct from old.guarantor_names
       or new.guarantor_emails is distinct from old.guarantor_emails then
      needs_new := true;
    end if;
  elsif tg_op = 'DELETE' then
    affected_old := old.loan_id;
    needs_old := affected_old is not null;
  end if;

  if needs_old then
    perform public.sync_application_from_primary_scenario(affected_old);
  end if;
  if needs_new then
    perform public.sync_application_from_primary_scenario(affected_new);
  end if;

  if tg_op = 'DELETE' then
    return old;
  else
    return new;
  end if;
end;
$$;


ALTER FUNCTION "public"."trg_loan_scenarios_sync_applications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_set_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return NEW;
end
$$;


ALTER FUNCTION "public"."trigger_set_timestamp"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ai_chat_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_chat_messages_user_type_check" CHECK (("user_type" = ANY (ARRAY['user'::"text", 'agent'::"text"])))
);


ALTER TABLE "public"."ai_chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_chats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_used_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" DEFAULT 'New chat'::"text" NOT NULL
);


ALTER TABLE "public"."ai_chats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."application_signings" (
    "id" bigint NOT NULL,
    "loan_id" "uuid" NOT NULL,
    "signer_email" "text" NOT NULL,
    "documenso_document_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."application_signings" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."application_signings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."application_signings_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."application_signings_id_seq" OWNED BY "public"."application_signings"."id";



CREATE TABLE IF NOT EXISTS "public"."applications" (
    "loan_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "property_street" "text",
    "property_city" "text",
    "property_state" "text",
    "property_zip" "text",
    "entity_id" "uuid",
    "borrower_name" "text",
    "guarantor_ids" "uuid"[],
    "guarantor_names" "text"[],
    "documenso_document_id" "text",
    "application_url" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "guarantor_emails" "text"[]
);


ALTER TABLE "public"."applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."applications_emails_sent" (
    "id" bigint NOT NULL,
    "email" "text" NOT NULL,
    "loan_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "initial" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."applications_emails_sent" OWNER TO "postgres";


ALTER TABLE "public"."applications_emails_sent" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."applications_emails_sent_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."borrower_entities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "borrower_id" "uuid" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "role" "text",
    "guarantor" boolean,
    "ownership_percent" numeric,
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."borrower_entities" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."borrowers_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."borrowers_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."borrowers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "display_id" "text" DEFAULT ('BRW-'::"text" || "lpad"(("nextval"('"public"."borrowers_seq"'::"regclass"))::"text", 5, '0'::"text")) NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text",
    "date_of_birth" "date",
    "fico_score" integer,
    "organization_id" "uuid" NOT NULL,
    "assigned_to" "text"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ssn_encrypted" "bytea",
    "ssn_last4" "text",
    "primary_phone" "text",
    "alt_phone" "text",
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "state" "text",
    "zip" "text",
    "county" "text",
    "citizenship" "text",
    "green_card" boolean,
    "visa" boolean,
    "visa_type" "text",
    "rentals_owned" integer,
    "fix_flips_3yrs" integer,
    "groundups_3yrs" integer,
    "real_estate_licensed" boolean,
    CONSTRAINT "borrowers_citizenship_check" CHECK (("citizenship" = ANY (ARRAY['U.S. Citizen'::"text", 'Permanent Resident'::"text", 'Non-Permanent Resident'::"text", 'Foreign National'::"text"]))),
    CONSTRAINT "borrowers_ssn_last4_check" CHECK (("ssn_last4" ~ '^[0-9]{4}$'::"text")),
    CONSTRAINT "borrowers_zip_check" CHECK (("zip" ~ '^[0-9]{5}$'::"text"))
);


ALTER TABLE "public"."borrowers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brokers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_member_id" "uuid",
    "clerk_user_id" "text",
    "clerk_invitation_id" "text",
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "joined_at" timestamp with time zone,
    "email" "text",
    "account_manager_ids" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "company_name" "text",
    "company_logo_url" "text",
    CONSTRAINT "brokers_status_chk" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."brokers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_report_chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "credit_report_chat_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "credit_report_chat_messages_user_type_check" CHECK (("user_type" = ANY (ARRAY['user'::"text", 'agent'::"text"])))
);


ALTER TABLE "public"."credit_report_chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_report_chats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_used_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" DEFAULT 'Credit report chat'::"text" NOT NULL,
    "active_guarantor_id" "uuid"
);


ALTER TABLE "public"."credit_report_chats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_report_user_chats" (
    "report_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "chat_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."credit_report_user_chats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_report_viewers" (
    "report_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "added_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."credit_report_viewers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket" "text" DEFAULT 'credit-reports'::"text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "assigned_to" "text"[] NOT NULL,
    "status" "text" DEFAULT 'stored'::"text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "borrower_id" "uuid",
    "organization_id" "uuid",
    "aggregator" "text"
);


ALTER TABLE "public"."credit_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_broker_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "organization_member_id" "uuid" NOT NULL,
    "broker_id" "uuid" NOT NULL,
    "allow_ysp" boolean DEFAULT false NOT NULL,
    "allow_buydown_rate" boolean DEFAULT false NOT NULL,
    "program_visibility" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "rates" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "default" boolean DEFAULT true,
    "allow_white_labeling" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."custom_broker_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."default_broker_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "organization_member_id" "uuid" NOT NULL,
    "allow_ysp" boolean DEFAULT false NOT NULL,
    "allow_buydown_rate" boolean DEFAULT false NOT NULL,
    "program_visibility" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "rates" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "allow_white_labeling" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."default_broker_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_templates" (
    "id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "craft_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."document_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" bigint NOT NULL,
    "content" "text",
    "metadata" "jsonb",
    "embedding" "public"."vector"(1536)
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."documents_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."documents_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."documents_id_seq" OWNED BY "public"."documents"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."entities_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."entities_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "display_id" "text" DEFAULT ('ENT-'::"text" || "lpad"(("nextval"('"public"."entities_seq"'::"regclass"))::"text", 5, '0'::"text")) NOT NULL,
    "entity_name" "text" NOT NULL,
    "entity_type" "text",
    "ein" "text",
    "date_formed" "date",
    "organization_id" "uuid" NOT NULL,
    "assigned_to" "text"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "state" "text",
    "zip" "text",
    "county" "text",
    "bank_name" "text",
    "account_balances" "text",
    "state_formed" "text",
    "members" integer
);


ALTER TABLE "public"."entities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "first_name" "text" DEFAULT ''::"text",
    "last_name" "text" DEFAULT ''::"text"
);


ALTER TABLE "public"."organization_members" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."entities_view" AS
 SELECT "id",
    "display_id",
    "entity_name",
    "entity_type",
    "ein",
    "date_formed",
    "organization_id",
    "assigned_to",
    "created_at",
    "updated_at",
    COALESCE(( SELECT "array_agg"(TRIM(BOTH FROM ((COALESCE("om"."first_name", ''::"text") || ' '::"text") || COALESCE("om"."last_name", ''::"text")))) AS "array_agg"
           FROM "public"."organization_members" "om"
          WHERE ("om"."user_id" = ANY ("e"."assigned_to"))), '{}'::"text"[]) AS "assigned_to_names"
   FROM "public"."entities" "e";


ALTER VIEW "public"."entities_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entity_owners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "name" "text",
    "title" "text",
    "member_type" "text",
    "ownership_percent" numeric,
    "address" "text",
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "borrower_id" "uuid",
    "entity_owner_id" "uuid",
    "ssn_encrypted" "text",
    "ssn_last4" "text",
    "ein" "text",
    CONSTRAINT "entity_owners_member_type_check" CHECK (("member_type" = ANY (ARRAY['Individual'::"text", 'Entity'::"text"])))
);


ALTER TABLE "public"."entity_owners" OWNER TO "postgres";


COMMENT ON COLUMN "public"."entity_owners"."ssn_encrypted" IS 'Encrypted SSN for individual owners (same scheme as borrowers)';



COMMENT ON COLUMN "public"."entity_owners"."ssn_last4" IS 'Last 4 digits of SSN for masked display';



COMMENT ON COLUMN "public"."entity_owners"."ein" IS 'EIN for entity-type owners (stored in plain text)';



CREATE TABLE IF NOT EXISTS "public"."integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "status" boolean DEFAULT false NOT NULL,
    "user_id" "text",
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."integrations_floify" (
    "integration_id" "uuid" NOT NULL,
    "x_api_key" "text" NOT NULL,
    "user_api_key" "text"
);


ALTER TABLE "public"."integrations_floify" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."loan_scenarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "loan_id" "uuid" NOT NULL,
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "inputs" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "selected" "jsonb" NOT NULL,
    "organization_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "primary" boolean,
    "user_id" "text",
    "borrower_entity_id" "uuid",
    "guarantor_borrower_ids" "uuid"[],
    "guarantor_names" "text"[],
    "guarantor_emails" "text"[]
);


ALTER TABLE "public"."loan_scenarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."loans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "program_id" "uuid",
    "borrower_first_name" "text",
    "borrower_last_name" "text",
    "property_address" "text",
    "loan_type" "text",
    "transaction_type" "text",
    "loan_amount" numeric(18,2),
    "rate" numeric(7,4),
    "status" "text",
    "assigned_to_user_id" "jsonb" DEFAULT '[]'::"jsonb",
    "meta" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "inputs" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "selected" "jsonb",
    "primary_user_id" "text"
);


ALTER TABLE "public"."loans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."n8n_chat_histories" (
    "id" integer NOT NULL,
    "session_id" character varying(255) NOT NULL,
    "message" "jsonb" NOT NULL
);


ALTER TABLE "public"."n8n_chat_histories" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."n8n_chat_histories_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."n8n_chat_histories_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."n8n_chat_histories_id_seq" OWNED BY "public"."n8n_chat_histories"."id";



CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "clerk_organization_id" "text"
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."program_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "program_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "title" "text",
    "mime_type" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "program_documents_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'indexed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."program_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."programs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "loan_type" "text" NOT NULL,
    "internal_name" "text" NOT NULL,
    "external_name" "text" NOT NULL,
    "webhook_url" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "user_id" "text" NOT NULL,
    CONSTRAINT "programs_loan_type_chk" CHECK (("loan_type" = ANY (ARRAY['dscr'::"text", 'bridge'::"text"]))),
    CONSTRAINT "programs_status_chk" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."programs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."term_sheets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "loan_id" "uuid" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "pdf_url" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."term_sheets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" bigint NOT NULL,
    "clerk_user_id" "text",
    "first_name" "text",
    "last_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE "public"."users" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."users_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."v_brokers_with_manager_names" AS
 SELECT "b"."id",
    "b"."organization_id",
    "b"."organization_member_id",
    "b"."email",
    "b"."joined_at",
    COALESCE("string_agg"(TRIM(BOTH FROM (("m"."first_name" || ' '::"text") || "m"."last_name")), ', '::"text" ORDER BY "m"."first_name", "m"."last_name"), ''::"text") AS "manager_names"
   FROM ("public"."brokers" "b"
     LEFT JOIN "public"."organization_members" "m" ON (("m"."id" = ANY ("b"."account_manager_ids"))))
  GROUP BY "b"."id", "b"."organization_id", "b"."organization_member_id", "b"."email", "b"."joined_at";


ALTER VIEW "public"."v_brokers_with_manager_names" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."xactus_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "borrower_id" "uuid",
    "raw_data" "text",
    "cleaned_data" json,
    "pull_type" "text",
    "transunion_score" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "experian_score" numeric,
    "equifax_score" numeric,
    "report_id" "uuid"
);


ALTER TABLE "public"."xactus_data" OWNER TO "postgres";


ALTER TABLE ONLY "public"."application_signings" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."application_signings_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."documents" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."documents_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."n8n_chat_histories" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."n8n_chat_histories_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ai_chat_messages"
    ADD CONSTRAINT "ai_chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_chats"
    ADD CONSTRAINT "ai_chats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."application_signings"
    ADD CONSTRAINT "application_signings_documenso_document_id_signer_email_key" UNIQUE ("documenso_document_id", "signer_email");



ALTER TABLE ONLY "public"."application_signings"
    ADD CONSTRAINT "application_signings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."applications_emails_sent"
    ADD CONSTRAINT "applications_emails_sent_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("loan_id");



ALTER TABLE ONLY "public"."borrower_entities"
    ADD CONSTRAINT "borrower_entities_borrower_entity_uid" UNIQUE ("borrower_id", "entity_id");



ALTER TABLE ONLY "public"."borrower_entities"
    ADD CONSTRAINT "borrower_entities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."borrowers"
    ADD CONSTRAINT "borrowers_display_id_key" UNIQUE ("display_id");



ALTER TABLE ONLY "public"."borrowers"
    ADD CONSTRAINT "borrowers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brokers"
    ADD CONSTRAINT "brokers_org_member_uniq" UNIQUE ("organization_id", "organization_member_id");



ALTER TABLE ONLY "public"."brokers"
    ADD CONSTRAINT "brokers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_report_chat_messages"
    ADD CONSTRAINT "credit_report_chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_report_chats"
    ADD CONSTRAINT "credit_report_chats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_report_user_chats"
    ADD CONSTRAINT "credit_report_user_chats_pkey" PRIMARY KEY ("report_id", "user_id");



ALTER TABLE ONLY "public"."credit_report_viewers"
    ADD CONSTRAINT "credit_report_viewers_pkey" PRIMARY KEY ("report_id", "user_id");



ALTER TABLE ONLY "public"."credit_reports"
    ADD CONSTRAINT "credit_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_broker_settings"
    ADD CONSTRAINT "custom_broker_settings_organization_id_broker_id_key" UNIQUE ("organization_id", "broker_id");



ALTER TABLE ONLY "public"."custom_broker_settings"
    ADD CONSTRAINT "custom_broker_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."default_broker_settings"
    ADD CONSTRAINT "default_broker_settings_org_member_unique" UNIQUE ("organization_id", "organization_member_id");



ALTER TABLE ONLY "public"."default_broker_settings"
    ADD CONSTRAINT "default_broker_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_templates"
    ADD CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."entities"
    ADD CONSTRAINT "entities_display_id_key" UNIQUE ("display_id");



ALTER TABLE ONLY "public"."entities"
    ADD CONSTRAINT "entities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."entity_owners"
    ADD CONSTRAINT "entity_owners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integrations_floify"
    ADD CONSTRAINT "integrations_floify_pkey" PRIMARY KEY ("integration_id");



ALTER TABLE ONLY "public"."integrations"
    ADD CONSTRAINT "integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loan_scenarios"
    ADD CONSTRAINT "loan_scenarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loans"
    ADD CONSTRAINT "loans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."n8n_chat_histories"
    ADD CONSTRAINT "n8n_chat_histories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_user_id_key" UNIQUE ("organization_id", "user_id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."program_documents"
    ADD CONSTRAINT "program_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."term_sheets"
    ADD CONSTRAINT "term_sheets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."xactus_data"
    ADD CONSTRAINT "xactus_reports_pkey" PRIMARY KEY ("id");



CREATE INDEX "ai_chats_last_used_at_desc_idx" ON "public"."ai_chats" USING "btree" ("last_used_at" DESC);



CREATE INDEX "ai_chats_org_id_idx" ON "public"."ai_chats" USING "btree" ("organization_id");



CREATE INDEX "ai_chats_user_id_idx" ON "public"."ai_chats" USING "btree" ("user_id");



CREATE INDEX "applications_documenso_idx" ON "public"."applications" USING "btree" ("documenso_document_id");



CREATE INDEX "applications_emails_sent_email_idx" ON "public"."applications_emails_sent" USING "btree" ("email");



CREATE UNIQUE INDEX "applications_emails_sent_initial_uidx" ON "public"."applications_emails_sent" USING "btree" ("loan_id", "email", "type") WHERE "initial";



CREATE INDEX "applications_emails_sent_loan_id_idx" ON "public"."applications_emails_sent" USING "btree" ("loan_id");



CREATE INDEX "applications_emails_sent_type_idx" ON "public"."applications_emails_sent" USING "btree" ("type");



CREATE INDEX "applications_org_idx" ON "public"."applications" USING "btree" ("organization_id");



CREATE INDEX "applications_updated_idx" ON "public"."applications" USING "btree" ("updated_at" DESC);



CREATE INDEX "borrower_entities_borrower_idx" ON "public"."borrower_entities" USING "btree" ("borrower_id");



CREATE INDEX "borrower_entities_entity_idx" ON "public"."borrower_entities" USING "btree" ("entity_id");



CREATE INDEX "borrower_entities_org_idx" ON "public"."borrower_entities" USING "btree" ("organization_id");



CREATE INDEX "borrowers_assigned_to_idx" ON "public"."borrowers" USING "gin" ("assigned_to");



CREATE INDEX "borrowers_org_idx" ON "public"."borrowers" USING "btree" ("organization_id");



CREATE INDEX "borrowers_zip_idx" ON "public"."borrowers" USING "btree" ("zip");



CREATE INDEX "brokers_org_member_idx" ON "public"."brokers" USING "btree" ("organization_id", "organization_member_id");



CREATE INDEX "credit_report_chats_last_used_desc_idx" ON "public"."credit_report_chats" USING "btree" ("last_used_at" DESC);



CREATE INDEX "credit_report_chats_org_id_idx" ON "public"."credit_report_chats" USING "btree" ("organization_id");



CREATE INDEX "credit_report_chats_user_id_idx" ON "public"."credit_report_chats" USING "btree" ("user_id");



CREATE INDEX "credit_report_user_chats_chat_idx" ON "public"."credit_report_user_chats" USING "btree" ("chat_id");



CREATE INDEX "credit_report_viewers_user_idx" ON "public"."credit_report_viewers" USING "btree" ("user_id");



CREATE UNIQUE INDEX "credit_reports_bucket_path_idx" ON "public"."credit_reports" USING "btree" ("bucket", "storage_path");



CREATE INDEX "credit_reports_owner_idx" ON "public"."credit_reports" USING "gin" ("assigned_to");



CREATE INDEX "document_templates_org_updated_idx" ON "public"."document_templates" USING "btree" ("organization_id", "updated_at" DESC);



CREATE INDEX "entities_assigned_to_idx" ON "public"."entities" USING "gin" ("assigned_to");



CREATE INDEX "entities_org_idx" ON "public"."entities" USING "btree" ("organization_id");



CREATE INDEX "entity_owners_borrower_idx" ON "public"."entity_owners" USING "btree" ("borrower_id");



CREATE INDEX "entity_owners_entity_idx" ON "public"."entity_owners" USING "btree" ("entity_id");



CREATE UNIQUE INDEX "entity_owners_entity_owner_idx" ON "public"."entity_owners" USING "btree" ("entity_id", "entity_owner_id") WHERE ("entity_owner_id" IS NOT NULL);



CREATE INDEX "entity_owners_org_idx" ON "public"."entity_owners" USING "btree" ("organization_id");



CREATE INDEX "idx_ai_chat_messages_chat_time" ON "public"."ai_chat_messages" USING "btree" ("ai_chat_id", "created_at");



CREATE INDEX "idx_application_signings_loan_id" ON "public"."application_signings" USING "btree" ("loan_id");



CREATE INDEX "idx_brokers_mgrs_gin" ON "public"."brokers" USING "gin" ("account_manager_ids");



CREATE INDEX "idx_brokers_org_id" ON "public"."brokers" USING "btree" ("organization_id");



CREATE INDEX "idx_brokers_status" ON "public"."brokers" USING "btree" ("status");



CREATE INDEX "idx_credit_report_chat_messages_chat_time" ON "public"."credit_report_chat_messages" USING "btree" ("credit_report_chat_id", "created_at");



CREATE INDEX "idx_custom_broker_settings_broker_id" ON "public"."custom_broker_settings" USING "btree" ("broker_id");



CREATE INDEX "idx_custom_broker_settings_org_id" ON "public"."custom_broker_settings" USING "btree" ("organization_id");



CREATE INDEX "idx_default_broker_settings_member_id" ON "public"."default_broker_settings" USING "btree" ("organization_member_id");



CREATE INDEX "idx_default_broker_settings_org_id" ON "public"."default_broker_settings" USING "btree" ("organization_id");



CREATE INDEX "idx_integrations_org" ON "public"."integrations" USING "btree" ("organization_id");



CREATE INDEX "idx_integrations_type" ON "public"."integrations" USING "btree" ("type");



CREATE INDEX "idx_loan_scenarios_inputs_gin" ON "public"."loan_scenarios" USING "gin" ("inputs");



CREATE INDEX "idx_loan_scenarios_selected_gin" ON "public"."loan_scenarios" USING "gin" ("selected");



CREATE INDEX "idx_loans_assigned_gin" ON "public"."loans" USING "gin" ("assigned_to_user_id" "jsonb_path_ops");



CREATE INDEX "idx_loans_inputs_gin" ON "public"."loans" USING "gin" ("inputs");



CREATE INDEX "idx_loans_org" ON "public"."loans" USING "btree" ("organization_id");



CREATE INDEX "idx_loans_primary_user" ON "public"."loans" USING "btree" ("primary_user_id");



CREATE INDEX "idx_loans_program" ON "public"."loans" USING "btree" ("program_id");



CREATE INDEX "idx_loans_selected_gin" ON "public"."loans" USING "gin" ("selected");



CREATE INDEX "idx_loans_status" ON "public"."loans" USING "btree" ("status");



CREATE INDEX "idx_org_members_org" ON "public"."organization_members" USING "btree" ("organization_id");



CREATE INDEX "idx_org_members_user" ON "public"."organization_members" USING "btree" ("user_id");



CREATE INDEX "idx_program_documents_program_id" ON "public"."program_documents" USING "btree" ("program_id");



CREATE INDEX "idx_programs_org" ON "public"."programs" USING "btree" ("organization_id");



CREATE INDEX "idx_scenarios_loan" ON "public"."loan_scenarios" USING "btree" ("loan_id");



CREATE INDEX "idx_term_sheets_loan" ON "public"."term_sheets" USING "btree" ("loan_id");



CREATE UNIQUE INDEX "idx_term_sheets_loan_version" ON "public"."term_sheets" USING "btree" ("loan_id", "version");



CREATE UNIQUE INDEX "organizations_clerk_organization_id_key" ON "public"."organizations" USING "btree" ("clerk_organization_id");



CREATE INDEX "programs_org_id_idx" ON "public"."programs" USING "btree" ("organization_id");



CREATE INDEX "programs_status_idx" ON "public"."programs" USING "btree" ("status");



CREATE INDEX "programs_user_id_idx" ON "public"."programs" USING "btree" ("user_id");



CREATE UNIQUE INDEX "uq_integrations_org_user_type" ON "public"."integrations" USING "btree" ("organization_id", "user_id", "type");



CREATE OR REPLACE TRIGGER "borrowers_set_updated_at" BEFORE UPDATE ON "public"."borrowers" FOR EACH ROW EXECUTE FUNCTION "public"."borrowers_set_updated_at"();



CREATE OR REPLACE TRIGGER "entities_set_updated_at" BEFORE UPDATE ON "public"."entities" FOR EACH ROW EXECUTE FUNCTION "public"."entities_set_updated_at"();



CREATE OR REPLACE TRIGGER "loans_set_updated_at" BEFORE UPDATE ON "public"."loans" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "organizations_set_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "programs_set_updated_at" BEFORE UPDATE ON "public"."programs" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_timestamp_on_brokers" BEFORE UPDATE ON "public"."brokers" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_timestamp_on_custom_broker_settings" BEFORE UPDATE ON "public"."custom_broker_settings" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_timestamp_on_default_broker_settings" BEFORE UPDATE ON "public"."default_broker_settings" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "trg_ai_chat_messages_touch_chat" AFTER INSERT ON "public"."ai_chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."touch_ai_chat_last_used"();



CREATE OR REPLACE TRIGGER "trg_applications_set_updated" BEFORE UPDATE ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "trg_applications_sync_from_primary_scenario" AFTER INSERT OR UPDATE OF "loan_id" ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."trg_applications_sync_from_primary_scenario"();



CREATE OR REPLACE TRIGGER "trg_applications_sync_primary_scenario" AFTER INSERT OR UPDATE OF "entity_id", "borrower_name", "guarantor_ids", "guarantor_names", "guarantor_emails" ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."trg_applications_sync_primary_scenario"();



CREATE OR REPLACE TRIGGER "trg_credit_report_chat_messages_touch_chat" AFTER INSERT ON "public"."credit_report_chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."touch_credit_report_chat_last_used"();



CREATE OR REPLACE TRIGGER "trg_ensure_floify_integration" BEFORE INSERT OR UPDATE ON "public"."integrations_floify" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_floify_integration"();



CREATE OR REPLACE TRIGGER "trg_insert_default_integrations_for_member" AFTER INSERT ON "public"."organization_members" FOR EACH ROW EXECUTE FUNCTION "public"."insert_default_integrations_for_member"();



CREATE OR REPLACE TRIGGER "trg_loan_scenarios_sync_applications" AFTER INSERT OR DELETE OR UPDATE ON "public"."loan_scenarios" FOR EACH ROW EXECUTE FUNCTION "public"."trg_loan_scenarios_sync_applications"();



CREATE OR REPLACE TRIGGER "trg_programs_set_updated_at" BEFORE UPDATE ON "public"."programs" FOR EACH ROW EXECUTE FUNCTION "public"."set_programs_updated_at"();



CREATE OR REPLACE TRIGGER "trg_seed_custom_broker_settings" AFTER INSERT ON "public"."brokers" FOR EACH ROW EXECUTE FUNCTION "public"."seed_custom_broker_settings_from_default"();



CREATE OR REPLACE TRIGGER "trg_seed_custom_broker_settings_on_member_attach" AFTER UPDATE OF "organization_member_id" ON "public"."brokers" FOR EACH ROW WHEN ((("new"."organization_member_id" IS NOT NULL) AND ("old"."organization_member_id" IS DISTINCT FROM "new"."organization_member_id"))) EXECUTE FUNCTION "public"."seed_custom_broker_settings_on_member_attach"();



CREATE OR REPLACE TRIGGER "trg_sync_assigned_from_viewers_del" AFTER DELETE ON "public"."credit_report_viewers" FOR EACH ROW EXECUTE FUNCTION "public"."sync_assigned_from_viewers_del"();



CREATE OR REPLACE TRIGGER "trg_sync_assigned_from_viewers_ins" AFTER INSERT ON "public"."credit_report_viewers" FOR EACH ROW EXECUTE FUNCTION "public"."sync_assigned_from_viewers_ins"();



CREATE OR REPLACE TRIGGER "trg_sync_borrower_to_entity_owners" AFTER UPDATE OF "first_name", "last_name", "ssn_last4", "address_line1", "city", "state", "zip" ON "public"."borrowers" FOR EACH ROW WHEN (("new"."id" IS NOT NULL)) EXECUTE FUNCTION "public"."sync_borrower_to_entity_owners"();



CREATE OR REPLACE TRIGGER "trg_sync_viewers_from_credit_reports" AFTER INSERT OR UPDATE ON "public"."credit_reports" FOR EACH ROW EXECUTE FUNCTION "public"."sync_viewers_from_credit_reports"();



ALTER TABLE ONLY "public"."ai_chat_messages"
    ADD CONSTRAINT "ai_chat_messages_ai_chat_id_fkey" FOREIGN KEY ("ai_chat_id") REFERENCES "public"."ai_chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_chat_messages"
    ADD CONSTRAINT "ai_chat_messages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_chats"
    ADD CONSTRAINT "ai_chats_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_signings"
    ADD CONSTRAINT "application_signings_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."borrower_entities"
    ADD CONSTRAINT "borrower_entities_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."borrower_entities"
    ADD CONSTRAINT "borrower_entities_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."borrowers"
    ADD CONSTRAINT "borrowers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brokers"
    ADD CONSTRAINT "brokers_org_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brokers"
    ADD CONSTRAINT "brokers_org_member_fk" FOREIGN KEY ("organization_member_id") REFERENCES "public"."organization_members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_report_chat_messages"
    ADD CONSTRAINT "credit_report_chat_messages_credit_report_chat_id_fkey" FOREIGN KEY ("credit_report_chat_id") REFERENCES "public"."credit_report_chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_report_chat_messages"
    ADD CONSTRAINT "credit_report_chat_messages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_report_chats"
    ADD CONSTRAINT "credit_report_chats_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_report_user_chats"
    ADD CONSTRAINT "credit_report_user_chats_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."credit_report_chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_report_user_chats"
    ADD CONSTRAINT "credit_report_user_chats_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."credit_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_report_viewers"
    ADD CONSTRAINT "credit_report_viewers_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."credit_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_reports"
    ADD CONSTRAINT "credit_reports_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_reports"
    ADD CONSTRAINT "credit_reports_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_broker_settings"
    ADD CONSTRAINT "custom_broker_settings_broker_fk" FOREIGN KEY ("broker_id") REFERENCES "public"."brokers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_broker_settings"
    ADD CONSTRAINT "custom_broker_settings_org_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_broker_settings"
    ADD CONSTRAINT "custom_broker_settings_org_member_fk" FOREIGN KEY ("organization_member_id") REFERENCES "public"."organization_members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."default_broker_settings"
    ADD CONSTRAINT "default_broker_settings_org_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."default_broker_settings"
    ADD CONSTRAINT "default_broker_settings_org_member_fk" FOREIGN KEY ("organization_member_id") REFERENCES "public"."organization_members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_templates"
    ADD CONSTRAINT "document_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entities"
    ADD CONSTRAINT "entities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entity_owners"
    ADD CONSTRAINT "entity_owners_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."entity_owners"
    ADD CONSTRAINT "entity_owners_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entity_owners"
    ADD CONSTRAINT "entity_owners_entity_owner_id_fkey" FOREIGN KEY ("entity_owner_id") REFERENCES "public"."entities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."entity_owners"
    ADD CONSTRAINT "entity_owners_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integrations_floify"
    ADD CONSTRAINT "integrations_floify_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loan_scenarios"
    ADD CONSTRAINT "loan_scenarios_borrower_entity_id_fkey" FOREIGN KEY ("borrower_entity_id") REFERENCES "public"."entities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."loan_scenarios"
    ADD CONSTRAINT "loan_scenarios_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loan_scenarios"
    ADD CONSTRAINT "loan_scenarios_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loans"
    ADD CONSTRAINT "loans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loans"
    ADD CONSTRAINT "loans_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."program_documents"
    ADD CONSTRAINT "program_documents_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."term_sheets"
    ADD CONSTRAINT "term_sheets_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."xactus_data"
    ADD CONSTRAINT "xactus_reports_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE CASCADE;



ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "applications_modify_org" ON "public"."applications" USING (true) WITH CHECK (true);



CREATE POLICY "applications_select_org" ON "public"."applications" FOR SELECT USING (true);



ALTER TABLE "public"."credit_report_viewers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "credit_report_viewers readable by owner/viewer" ON "public"."credit_report_viewers" FOR SELECT USING ((("auth"."role"() = 'service_role'::"text") OR ("user_id" = ("auth"."uid"())::"text") OR ("added_by" = ("auth"."uid"())::"text") OR (EXISTS ( SELECT 1
   FROM "public"."credit_reports" "cr"
  WHERE (("cr"."id" = "credit_report_viewers"."report_id") AND (("auth"."uid"())::"text" = ANY ("cr"."assigned_to")))))));



CREATE POLICY "credit_report_viewers service role all" ON "public"."credit_report_viewers" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."credit_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "credit_reports owner or viewer select" ON "public"."credit_reports" FOR SELECT USING ((("auth"."role"() = 'service_role'::"text") OR (("auth"."uid"())::"text" = ANY ("assigned_to")) OR (EXISTS ( SELECT 1
   FROM "public"."credit_report_viewers" "v"
  WHERE (("v"."report_id" = "credit_reports"."id") AND ("v"."user_id" = ("auth"."uid"())::"text"))))));



CREATE POLICY "credit_reports service role all" ON "public"."credit_reports" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."integrations_floify" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "integrations_floify_mod" ON "public"."integrations_floify" USING ((EXISTS ( SELECT 1
   FROM "public"."integrations" "i"
  WHERE (("i"."id" = "integrations_floify"."integration_id") AND ("i"."organization_id" = ("current_setting"('app.org_id'::"text", true))::"uuid") AND (("i"."user_id" IS NULL) OR ("i"."user_id" = "current_setting"('app.user_id'::"text", true))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."integrations" "i"
  WHERE (("i"."id" = "integrations_floify"."integration_id") AND ("i"."organization_id" = ("current_setting"('app.org_id'::"text", true))::"uuid") AND (("i"."user_id" IS NULL) OR ("i"."user_id" = "current_setting"('app.user_id'::"text", true)))))));



CREATE POLICY "integrations_floify_select" ON "public"."integrations_floify" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."integrations" "i"
  WHERE (("i"."id" = "integrations_floify"."integration_id") AND ("i"."organization_id" = ("current_setting"('app.org_id'::"text", true))::"uuid") AND (("i"."user_id" IS NULL) OR ("i"."user_id" = "current_setting"('app.user_id'::"text", true)))))));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."xactus_data" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."borrowers_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."borrowers_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."borrowers_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_floify_integration"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_floify_integration"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_floify_integration"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_user_chat"("p_report_id" "uuid", "p_org_id" "uuid", "p_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_user_chat"("p_report_id" "uuid", "p_org_id" "uuid", "p_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_user_chat"("p_report_id" "uuid", "p_org_id" "uuid", "p_user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."entities_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."entities_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."entities_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_default_integrations_for_member"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_default_integrations_for_member"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_default_integrations_for_member"() TO "service_role";



GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_program_chunks"("p_program_id" "uuid", "p_query_embedding" "public"."vector", "p_match_count" integer, "p_min_cosine_sim" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."match_program_chunks"("p_program_id" "uuid", "p_query_embedding" "public"."vector", "p_match_count" integer, "p_min_cosine_sim" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_program_chunks"("p_program_id" "uuid", "p_query_embedding" "public"."vector", "p_match_count" integer, "p_min_cosine_sim" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_custom_broker_settings_from_default"() TO "anon";
GRANT ALL ON FUNCTION "public"."seed_custom_broker_settings_from_default"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_custom_broker_settings_from_default"() TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_custom_broker_settings_on_member_attach"() TO "anon";
GRANT ALL ON FUNCTION "public"."seed_custom_broker_settings_on_member_attach"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_custom_broker_settings_on_member_attach"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_programs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_programs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_programs_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_application_from_primary_scenario"("p_loan_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."sync_application_from_primary_scenario"("p_loan_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_application_from_primary_scenario"("p_loan_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_assigned_from_viewers_del"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_assigned_from_viewers_del"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_assigned_from_viewers_del"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_assigned_from_viewers_ins"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_assigned_from_viewers_ins"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_assigned_from_viewers_ins"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_borrower_to_entity_owners"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_borrower_to_entity_owners"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_borrower_to_entity_owners"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_primary_scenario_from_application"("p_loan_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."sync_primary_scenario_from_application"("p_loan_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_primary_scenario_from_application"("p_loan_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_viewers_from_credit_reports"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_viewers_from_credit_reports"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_viewers_from_credit_reports"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_ai_chat_last_used"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_ai_chat_last_used"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_ai_chat_last_used"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_credit_report_chat_last_used"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_credit_report_chat_last_used"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_credit_report_chat_last_used"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_applications_sync_from_primary_scenario"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_applications_sync_from_primary_scenario"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_applications_sync_from_primary_scenario"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_applications_sync_primary_scenario"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_applications_sync_primary_scenario"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_applications_sync_primary_scenario"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_loan_scenarios_sync_applications"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_loan_scenarios_sync_applications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_loan_scenarios_sync_applications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "service_role";



GRANT ALL ON TABLE "public"."ai_chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."ai_chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."ai_chats" TO "anon";
GRANT ALL ON TABLE "public"."ai_chats" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_chats" TO "service_role";



GRANT ALL ON TABLE "public"."application_signings" TO "anon";
GRANT ALL ON TABLE "public"."application_signings" TO "authenticated";
GRANT ALL ON TABLE "public"."application_signings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."application_signings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."application_signings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."application_signings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."applications" TO "anon";
GRANT ALL ON TABLE "public"."applications" TO "authenticated";
GRANT ALL ON TABLE "public"."applications" TO "service_role";



GRANT ALL ON TABLE "public"."applications_emails_sent" TO "anon";
GRANT ALL ON TABLE "public"."applications_emails_sent" TO "authenticated";
GRANT ALL ON TABLE "public"."applications_emails_sent" TO "service_role";



GRANT ALL ON SEQUENCE "public"."applications_emails_sent_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."applications_emails_sent_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."applications_emails_sent_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."borrower_entities" TO "anon";
GRANT ALL ON TABLE "public"."borrower_entities" TO "authenticated";
GRANT ALL ON TABLE "public"."borrower_entities" TO "service_role";



GRANT ALL ON SEQUENCE "public"."borrowers_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."borrowers_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."borrowers_seq" TO "service_role";



GRANT ALL ON TABLE "public"."borrowers" TO "anon";
GRANT ALL ON TABLE "public"."borrowers" TO "authenticated";
GRANT ALL ON TABLE "public"."borrowers" TO "service_role";



GRANT ALL ON TABLE "public"."brokers" TO "anon";
GRANT ALL ON TABLE "public"."brokers" TO "authenticated";
GRANT ALL ON TABLE "public"."brokers" TO "service_role";



GRANT ALL ON TABLE "public"."credit_report_chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."credit_report_chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_report_chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."credit_report_chats" TO "anon";
GRANT ALL ON TABLE "public"."credit_report_chats" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_report_chats" TO "service_role";



GRANT ALL ON TABLE "public"."credit_report_user_chats" TO "anon";
GRANT ALL ON TABLE "public"."credit_report_user_chats" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_report_user_chats" TO "service_role";



GRANT ALL ON TABLE "public"."credit_report_viewers" TO "anon";
GRANT ALL ON TABLE "public"."credit_report_viewers" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_report_viewers" TO "service_role";



GRANT ALL ON TABLE "public"."credit_reports" TO "anon";
GRANT ALL ON TABLE "public"."credit_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_reports" TO "service_role";



GRANT ALL ON TABLE "public"."custom_broker_settings" TO "anon";
GRANT ALL ON TABLE "public"."custom_broker_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_broker_settings" TO "service_role";



GRANT ALL ON TABLE "public"."default_broker_settings" TO "anon";
GRANT ALL ON TABLE "public"."default_broker_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."default_broker_settings" TO "service_role";



GRANT ALL ON TABLE "public"."document_templates" TO "anon";
GRANT ALL ON TABLE "public"."document_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."document_templates" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."entities_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."entities_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."entities_seq" TO "service_role";



GRANT ALL ON TABLE "public"."entities" TO "anon";
GRANT ALL ON TABLE "public"."entities" TO "authenticated";
GRANT ALL ON TABLE "public"."entities" TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "anon";
GRANT ALL ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";



GRANT ALL ON TABLE "public"."entities_view" TO "anon";
GRANT ALL ON TABLE "public"."entities_view" TO "authenticated";
GRANT ALL ON TABLE "public"."entities_view" TO "service_role";



GRANT ALL ON TABLE "public"."entity_owners" TO "anon";
GRANT ALL ON TABLE "public"."entity_owners" TO "authenticated";
GRANT ALL ON TABLE "public"."entity_owners" TO "service_role";



GRANT ALL ON TABLE "public"."integrations" TO "anon";
GRANT ALL ON TABLE "public"."integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."integrations" TO "service_role";



GRANT ALL ON TABLE "public"."integrations_floify" TO "anon";
GRANT ALL ON TABLE "public"."integrations_floify" TO "authenticated";
GRANT ALL ON TABLE "public"."integrations_floify" TO "service_role";



GRANT ALL ON TABLE "public"."loan_scenarios" TO "anon";
GRANT ALL ON TABLE "public"."loan_scenarios" TO "authenticated";
GRANT ALL ON TABLE "public"."loan_scenarios" TO "service_role";



GRANT ALL ON TABLE "public"."loans" TO "anon";
GRANT ALL ON TABLE "public"."loans" TO "authenticated";
GRANT ALL ON TABLE "public"."loans" TO "service_role";



GRANT ALL ON TABLE "public"."n8n_chat_histories" TO "anon";
GRANT ALL ON TABLE "public"."n8n_chat_histories" TO "authenticated";
GRANT ALL ON TABLE "public"."n8n_chat_histories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."n8n_chat_histories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."n8n_chat_histories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."n8n_chat_histories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."program_documents" TO "anon";
GRANT ALL ON TABLE "public"."program_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."program_documents" TO "service_role";



GRANT ALL ON TABLE "public"."programs" TO "anon";
GRANT ALL ON TABLE "public"."programs" TO "authenticated";
GRANT ALL ON TABLE "public"."programs" TO "service_role";



GRANT ALL ON TABLE "public"."term_sheets" TO "anon";
GRANT ALL ON TABLE "public"."term_sheets" TO "authenticated";
GRANT ALL ON TABLE "public"."term_sheets" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."v_brokers_with_manager_names" TO "anon";
GRANT ALL ON TABLE "public"."v_brokers_with_manager_names" TO "authenticated";
GRANT ALL ON TABLE "public"."v_brokers_with_manager_names" TO "service_role";



GRANT ALL ON TABLE "public"."xactus_data" TO "anon";
GRANT ALL ON TABLE "public"."xactus_data" TO "authenticated";
GRANT ALL ON TABLE "public"."xactus_data" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







