-- Rename api_key to x_api_key and add user_api_key for Floify
alter table integrations_floify
  rename column api_key to x_api_key;

alter table integrations_floify
  add column if not exists user_api_key text;

-- Existing rows will have user_api_key = null; inserts/updates should supply both keys.
