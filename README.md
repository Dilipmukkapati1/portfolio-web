# portfolio-web

Next.js 15 frontend for Personal Portfolio Management (Azure Static Web Apps).

## Run locally

Pick an API target:

| Command | API | Household |
| ------- | --- | --------- |
| `npm run dev` | Azure dev (`ppm-dev-func-*.azurewebsites.net`) | `dev-household` |
| `npm run dev:local` | Local (`localhost:7071`) | `local-household` |

`npm run dev` is the default for UI work — no local Function App required.  
`npm run dev:local` requires portfolio-api running (`cd ../portfolio-api && npm start`).

Both commands pin the web app to **port 3000** (required for Azure dev CORS).

On first run, `predev` creates `.env.local` from `env/azure-dev.env.example` with auth credentials only.

```bash
npm install
npm run dev          # Azure dev API
# or
npm run dev:local    # local portfolio-api
```

Sign in at http://localhost:3000 with **admin** / **portfolio** (or values from `.env.local`).

**Note:** SimpleFIN data on the dev API lives under `dev-household`, not `local-household`.

## Deploy (Azure)

Deploy to Azure Static Web Apps from your machine (same SWA CLI flow as CI). Resource names and API URL come from `portfolio-infra` Terraform outputs.

**Prerequisites:** `az login`, Terraform stack applied for the target env, Node 20+, `terraform`, `jq`.

```bash
npm run deploy:dev              # dev Static Web App
npm run deploy:prod             # prod — prompts: type prod to confirm
npm run deploy -- dev --skip-build
```

| Script | Purpose |
| ------ | ------- |
| `deploy:dev` | Build with dev `NEXT_PUBLIC_*`, deploy dev SWA |
| `deploy:prod` | Build for prod API URL after confirmation |
| `--skip-build` | Skip local `next build` (Azure builds from source; `NEXT_PUBLIC_*` still passed) |

`NEXT_PUBLIC_API_URL` is set from `${env}_function_app_url` (e.g. `https://ppm-dev-func-*.azurewebsites.net/api`).

Deploy the API separately: `cd ../portfolio-api && npm run deploy:dev`.

**CI/CD:** Push to `develop` deploys Azure dev; merge to `main` deploys Azure prod. Configure `AZURE_STATIC_WEB_APPS_API_TOKEN` and `vars.FUNCTION_APP_BASE_URL` in GitHub environments `dev` and `prod` (see `portfolio-infra/docs/github-wiring.md`).
