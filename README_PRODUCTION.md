# PaperLens Production Environment and Deployment

This runbook describes the production environment for the PaperLens web and
backend services. It intentionally contains no real credential.

## 1. Production Architecture

```text
Browser
  |
  +-- https://paperlens.uk
  |      OpenResty -> frontend container -> host port 9001
  |
  +-- https://api.paperlens.uk
         OpenResty -> backend container -> host port 9000

Jenkins User1/LiemResearch
  -> checks out main
  -> builds backend and web Docker images
  -> creates .env.runtime from a protected Jenkins credential
  -> starts backend, web and LibreTranslate containers
```

Public endpoints:

| Purpose | URL |
|---|---|
| Web application | `https://paperlens.uk` |
| API base | `https://api.paperlens.uk/api/v1` |
| Backend health | `https://api.paperlens.uk/health` |
| Google OAuth callback | `https://api.paperlens.uk/api/v1/auth/google/callback` |

DNS and TLS are handled outside the repository. Both DNS records must resolve
to the deployment server, and OpenResty must proxy the two hostnames to ports
`9001` and `9000` respectively.

## 2. Files and Secret Boundaries

| File or secret | Purpose | Commit to Git? |
|---|---|---|
| `apps/backend/.env.production.example` | Complete safe production template | Yes |
| `apps/backend/.env.production` | Real backend production values | No |
| `apps/backend/.env` | Local developer values | No |
| `.env.compose` | Private Docker Compose values | No |
| Jenkins credential `liemresearch-backend-env-b64` | Base64 form of the real production environment | No |
| Jenkins temporary `.env.runtime` | Decoded environment used by `docker run` | No; deleted after every build |

Never send the private file through GitHub, an issue, a pull request, build
logs, or a public chat. Transfer it directly to the authorized operator through
an approved private channel.

## 3. Prepare the Private Production Environment

Start from the safe template:

```powershell
Copy-Item apps/backend/.env.production.example apps/backend/.env.production
```

Fill every `<required-...>` value with the real credential. At minimum, the
backend requires:

- `MONGODB_URI`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `GEMINI_API_KEY`

R2 values are also mandatory when `STORAGE_PROVIDER=r2`. Google values are
needed when Google sign-in is enabled.

Keep these public values unchanged:

```env
NODE_ENV=production
PORT=4000
CORS_ORIGIN=https://paperlens.uk
GOOGLE_CALLBACK_URL=https://api.paperlens.uk/api/v1/auth/google/callback
TRANSLATION_PROVIDER=libretranslate
LIBRETRANSLATE_URL=http://libretranslate:5000
SYNC_ADMIN_BYPASS=false
```

Validate that Git ignores the private file:

```powershell
git check-ignore apps/backend/.env.production
```

The command must print `apps/backend/.env.production`.

## 4. Store the Environment in Jenkins

The pipeline expects a Jenkins **Secret text** credential with this ID:

```text
liemresearch-backend-env-b64
```

Encode the private file as one Base64 line without printing its contents:

```powershell
$path = Resolve-Path "apps/backend/.env.production"
$encoded = [Convert]::ToBase64String([IO.File]::ReadAllBytes($path))
Set-Clipboard -Value $encoded
Remove-Variable encoded
```

Then update the Secret field of `liemresearch-backend-env-b64` in Jenkins from
the clipboard. Do not add the encoded value to the pipeline script; Base64 is
transport encoding, not encryption.

On Linux with GNU coreutils:

```bash
base64 -w 0 apps/backend/.env.production | xclip -selection clipboard
```

During deployment, Jenkins creates the private runtime file:

```bash
printf '%s' "$BACKEND_ENV_B64" | base64 -d > .env.runtime
```

The pipeline removes `.env.runtime` in its `post { always { ... } }` block.

## 5. Jenkins Production Overrides

The web image must be built with the API subdomain:

```bash
docker build \
  --build-arg VITE_API_BASE=https://api.paperlens.uk/api/v1 \
  -t "$WEB_IMAGE" \
  -f Dockerfile.web .
```

The backend container must include these runtime overrides after
`--env-file .env.runtime`:

```bash
-e NODE_ENV=production \
-e PORT=4000 \
-e CORS_ORIGIN=https://paperlens.uk \
-e GOOGLE_CALLBACK_URL=https://api.paperlens.uk/api/v1/auth/google/callback \
-e TRANSLATION_PROVIDER=libretranslate \
-e LIBRETRANSLATE_URL=http://libretranslate:5000
```

Explicit `docker run -e` values override matching values from `.env.runtime`.
This keeps deployment URLs correct even if an older private file still contains
a local callback.

## 6. Google OAuth

In Google Cloud Console, configure the production OAuth client with:

**Authorized JavaScript origins**

```text
https://paperlens.uk
```

**Authorized redirect URIs**

```text
https://api.paperlens.uk/api/v1/auth/google/callback
```

The value must match `GOOGLE_CALLBACK_URL` exactly, including `https`, path and
the absence of a trailing slash. Keep localhost entries only when local OAuth
testing is still required.

After changing either Jenkins or Google Cloud, deploy again and test in a
private browser window to avoid a stale OAuth session.

## 7. Deploy

1. Open `User1/LiemResearch` in Jenkins.
2. Select **Configure** and verify the production build argument and runtime
   overrides above.
3. Select **Save**.
4. Select **Build Now**.
5. Wait for `Finished: SUCCESS`.
6. Allow a short container startup period before treating an initial OpenResty
   `502 Bad Gateway` as a persistent failure.

The current pipeline deploys the web application, backend and LibreTranslate.
It also removes worker containers at the end. Reports, research gaps,
embeddings, paper analysis, notifications, corpus validation, sync and
million-scale ingestion will not process queued jobs unless their worker
containers are deployed separately.

## 8. Verify Production

Basic health:

```powershell
Invoke-WebRequest https://paperlens.uk -UseBasicParsing
Invoke-WebRequest https://api.paperlens.uk/health -UseBasicParsing
```

Both requests must return HTTP `200`.

CORS preflight:

```powershell
$headers = @{
  Origin = "https://paperlens.uk"
  "Access-Control-Request-Method" = "GET"
  "Access-Control-Request-Headers" = "authorization,content-type"
}

Invoke-WebRequest `
  -Uri "https://api.paperlens.uk/api/v1/papers/translation/capabilities" `
  -Method Options `
  -Headers $headers `
  -UseBasicParsing
```

Expected:

```text
Status: 204
Access-Control-Allow-Origin: https://paperlens.uk
```

Translation capability:

```powershell
Invoke-WebRequest `
  "https://api.paperlens.uk/api/v1/papers/translation/capabilities" `
  -UseBasicParsing
```

Google sign-in must leave Google at:

```text
https://api.paperlens.uk/api/v1/auth/google/callback
```

If it redirects to `localhost`, verify both the Jenkins runtime override and
Google Authorized redirect URI.

## 9. Rotate or Transfer Production Secrets

When sending the environment to the project supervisor:

1. Send only `apps/backend/.env.production` through a private channel.
2. Do not send `.env.production.b64` unless Jenkins specifically requires the
   encoded form.
3. Ask the receiver to store it outside Git and restrict file permissions.
4. Rotate any credential that was pasted into a public repository, public chat,
   screenshot, issue, or build log.
5. Update the Jenkins credential and redeploy after rotating a value.

The committed example and this README are documentation only. They are not a
substitute for the private production environment.
