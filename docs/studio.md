# Italianamente Studio

Studio is the private editor at `/studio`. Published content remains in
`content/**/*.mdx`; drafts and audit events live in Neon.

## Services

1. Connect the existing Neon integration to the Vercel project and run
   `db/0001_studio.sql` in the Neon SQL editor.
2. Create a Resend API key and verify the domain used by `AUTH_EMAIL_FROM`.
3. Create a Vercel Blob store connected to the project.
4. Create a GitHub App installed only on `Brickfielder/Italianamente`.
   Grant `Contents: Read and write` and `Pull requests: Read and write`.
5. Add the variables documented in `.env.example` to Vercel Production,
   Preview, and Development environments.
6. Rotate the old Tina token because a generated client previously contained
   it in repository history.

## Workflow

- Studio autosaves editable drafts to Neon.
- `Crea anteprima` writes the sanitized MDX to a `studio/*` branch and opens
  or updates a pull request.
- Vercel creates the branch preview through its normal Git integration.
- `Pubblica` checks that `main` has not moved, then squash-merges the PR.
- Archived posts remain in Git but are omitted from public pages.

## Local development

`pnpm dev` runs Next.js without Tina. `/studio` shows a setup screen until the
Studio environment variables are present. The temporary rollback editor can
still be started with `pnpm dev:tina` during the validation period.

For local UI inspection without connecting services, set
`STUDIO_DEMO_MODE=true`. Demo mode loads real MDX but disables persistence,
uploads, preview creation, and publishing. It is ignored in production.
