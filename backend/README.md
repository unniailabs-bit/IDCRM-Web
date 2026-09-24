# CloudRUN-idcrm
IDCRM

## Local setup

1. Copy `.env.example` to `.env`
2. Install dependencies and start the server:

```bash
npm install
npm start
```

Fill in `.env` with your local database credentials and secrets. Do not commit `.env`.

```bash
gcloud builds submit --config cloudbuild.yaml .
```

# CloudSQL

```bash
 gcloud sql connect idcrm-db --user=postgres --quiet

 DROP DATABASE idcrm;
 CREATE DATABASE idcrm;

 gcloud sql import sql idcrm-db gs://id-crm-db-imports-asha-id-crm/idcrmFinaldb.sql --database=idcrm --user=postgres

```