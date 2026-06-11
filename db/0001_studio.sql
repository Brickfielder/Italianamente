CREATE TABLE IF NOT EXISTS studio_user (
  id text PRIMARY KEY,
  name text,
  email text UNIQUE,
  email_verified timestamptz,
  image text
);

CREATE TABLE IF NOT EXISTS studio_account (
  user_id text NOT NULL REFERENCES studio_user(id) ON DELETE CASCADE,
  type text NOT NULL,
  provider text NOT NULL,
  provider_account_id text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  PRIMARY KEY (provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS studio_session (
  session_token text PRIMARY KEY,
  user_id text NOT NULL REFERENCES studio_user(id) ON DELETE CASCADE,
  expires timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS studio_verification_token (
  identifier text NOT NULL,
  token text NOT NULL,
  expires timestamptz NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS studio_draft (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_path text NOT NULL UNIQUE,
  document_type text NOT NULL,
  title text NOT NULL,
  payload jsonb NOT NULL,
  base_sha text,
  preview_branch text,
  pull_request_number integer,
  preview_url text,
  status text NOT NULL DEFAULT 'draft',
  user_id text REFERENCES studio_user(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS studio_audit_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid REFERENCES studio_draft(id) ON DELETE SET NULL,
  user_id text REFERENCES studio_user(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
