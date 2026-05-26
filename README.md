# portfolio-web

Next.js 15 frontend for Personal Portfolio Management (Azure Static Web Apps).

## Run locally

**Against local API** (portfolio-api on port 7071):

```bash
cp .env.example .env.local
npm install
npm run dev
```

**Against dev API** (same accounts/data as the deployed dev site):

```bash
cp env/local-against-dev.env.example .env.local
npm install
npm run dev
```

Use `dev-household` when calling the dev Function App — SimpleFIN data is stored there, not `local-household`.

Open http://localhost:3000 and sign in with **admin** / **portfolio** (or values from `AUTH_USERNAME` / `AUTH_PASSWORD` in `.env.local`).

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

**CI:** GitHub Actions on `main` also deploys to dev when `AZURE_STATIC_WEB_APPS_API_TOKEN` is configured.
