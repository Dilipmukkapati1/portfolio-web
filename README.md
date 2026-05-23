# portfolio-web

Next.js 15 frontend for Personal Portfolio Management (Azure Static Web Apps).

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

## Deploy

GitHub Actions deploys to Azure Static Web Apps. Set `NEXT_PUBLIC_API_URL` to your Function App URL.
