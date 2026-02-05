SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict y5PMkT1Q3pnbNX5wOTwxdPjKFgOsQM8WZLzUwmgyM7fejWa5p40fjtP7haYvtHA

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."organizations" ("id", "name", "slug", "created_at", "updated_at", "clerk_organization_id") VALUES
	('5a5ebcd4-7327-42bf-9d0e-b3b6c735a075', 'Brrrr Funder LLC', 'brrrr-funder-llc', '2026-01-19 08:23:14.924844+00', '2026-01-19 08:23:14.924844+00', 'org_38MVrtrQBrhnDmbz9w90xrm24uT'),
	('082f8b26-cfc9-401a-9fea-2d764381b2cc', 'Brrrr Labs', 'brrrr-labs', '2026-01-19 08:23:14.924844+00', '2026-01-19 08:23:14.924844+00', 'org_35fqSMtj4QKmJfK3qDbTUvhle5U');


--
-- Data for Name: ai_chats; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ai_chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: programs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: loans; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: application_signings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: entities; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: applications_emails_sent; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: borrowers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: borrower_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: organization_members; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: brokers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: credit_report_chats; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: credit_report_chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: credit_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: credit_report_user_chats; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: credit_report_viewers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: custom_broker_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: default_broker_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: document_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: entity_owners; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: integrations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: integrations_floify; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: loan_scenarios; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: n8n_chat_histories; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: program_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: program_documents_chunks_vs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: term_sheets; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: xactus_data; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- Name: application_signings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."application_signings_id_seq"', 1, false);


--
-- Name: applications_emails_sent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."applications_emails_sent_id_seq"', 1, false);


--
-- Name: borrowers_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."borrowers_seq"', 1, false);


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."documents_id_seq"', 1, false);


--
-- Name: entities_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."entities_seq"', 1, false);


--
-- Name: n8n_chat_histories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."n8n_chat_histories_id_seq"', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."users_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict y5PMkT1Q3pnbNX5wOTwxdPjKFgOsQM8WZLzUwmgyM7fejWa5p40fjtP7haYvtHA

RESET ALL;
