# CloudRUN-idcrm

IDCRM

## Local setup

1. Copy `frontend/.env.example` to `frontend/.env`
2. Install dependencies and start the dev server:

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_BACKEND_URL` in `frontend/.env` to your backend API URL. Do not commit `.env`.

```bash
gcloud builds submit --config cloudbuild.yaml .

gcloud builds submit --config cloudbuild.yaml --substitutions=_SERVICE=backend .

gcloud builds submit --config cloudbuild.yaml --substitutions=_SERVICE=frontend .
```

# CloudSQL

```bash
 gcloud sql connect idcrm-db --user=postgres --quiet

 DROP DATABASE idcrm;
 CREATE DATABASE idcrm;

 gcloud sql import sql idcrm-db gs://id-crm-db-imports-asha-id-crm/idcrmFinaldb.sql --database=idcrm --user=postgres

```
