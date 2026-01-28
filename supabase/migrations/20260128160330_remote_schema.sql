create extension if not exists "pgjwt" with schema "extensions";

drop extension if exists "pg_net";

revoke delete on table "public"."documents" from "anon";

revoke insert on table "public"."documents" from "anon";

revoke references on table "public"."documents" from "anon";

revoke select on table "public"."documents" from "anon";

revoke trigger on table "public"."documents" from "anon";

revoke truncate on table "public"."documents" from "anon";

revoke update on table "public"."documents" from "anon";

revoke delete on table "public"."documents" from "authenticated";

revoke insert on table "public"."documents" from "authenticated";

revoke references on table "public"."documents" from "authenticated";

revoke select on table "public"."documents" from "authenticated";

revoke trigger on table "public"."documents" from "authenticated";

revoke truncate on table "public"."documents" from "authenticated";

revoke update on table "public"."documents" from "authenticated";

revoke delete on table "public"."documents" from "service_role";

revoke insert on table "public"."documents" from "service_role";

revoke references on table "public"."documents" from "service_role";

revoke select on table "public"."documents" from "service_role";

revoke trigger on table "public"."documents" from "service_role";

revoke truncate on table "public"."documents" from "service_role";

revoke update on table "public"."documents" from "service_role";

alter table "public"."documents" drop constraint "documents_pkey";

drop index if exists "public"."documents_pkey";

drop table "public"."documents";


  create table "public"."program_documents_chunks_vs" (
    "id" bigint not null default nextval('public.documents_id_seq'::regclass),
    "content" text,
    "metadata" jsonb,
    "embedding" public.vector(1536)
      );


alter sequence "public"."documents_id_seq" owned by "public"."program_documents_chunks_vs"."id";

CREATE UNIQUE INDEX documents_pkey ON public.program_documents_chunks_vs USING btree (id);

alter table "public"."program_documents_chunks_vs" add constraint "documents_pkey" PRIMARY KEY using index "documents_pkey";

grant delete on table "public"."program_documents_chunks_vs" to "anon";

grant insert on table "public"."program_documents_chunks_vs" to "anon";

grant references on table "public"."program_documents_chunks_vs" to "anon";

grant select on table "public"."program_documents_chunks_vs" to "anon";

grant trigger on table "public"."program_documents_chunks_vs" to "anon";

grant truncate on table "public"."program_documents_chunks_vs" to "anon";

grant update on table "public"."program_documents_chunks_vs" to "anon";

grant delete on table "public"."program_documents_chunks_vs" to "authenticated";

grant insert on table "public"."program_documents_chunks_vs" to "authenticated";

grant references on table "public"."program_documents_chunks_vs" to "authenticated";

grant select on table "public"."program_documents_chunks_vs" to "authenticated";

grant trigger on table "public"."program_documents_chunks_vs" to "authenticated";

grant truncate on table "public"."program_documents_chunks_vs" to "authenticated";

grant update on table "public"."program_documents_chunks_vs" to "authenticated";

grant delete on table "public"."program_documents_chunks_vs" to "service_role";

grant insert on table "public"."program_documents_chunks_vs" to "service_role";

grant references on table "public"."program_documents_chunks_vs" to "service_role";

grant select on table "public"."program_documents_chunks_vs" to "service_role";

grant trigger on table "public"."program_documents_chunks_vs" to "service_role";

grant truncate on table "public"."program_documents_chunks_vs" to "service_role";

grant update on table "public"."program_documents_chunks_vs" to "service_role";


