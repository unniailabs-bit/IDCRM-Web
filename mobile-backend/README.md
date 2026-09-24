# Asha School App API

## Local setup

1. Copy `.env.example` to `.env`
2. Install dependencies and start the server:

```bash
npm install
npm start
```

Fill in `.env` with your local database credentials and secrets. Do not commit `.env`.

## Database migrations

After deploying, run pending migrations (tracks applied scripts in `schema_migrations`):

```bash
npm run migrate
```

Current migrations:

- `001_backfill_parent_account_phones.js` — backfills `parent_accounts.phone` from linked students and normalizes `teachers.phone`
- `002_create_phone_login_indexes.js` — indexes for phone-based login lookups

Add new migrations as `migrations/00N_description.js` exporting an `up(sequelize)` function.

## Parent account migration (legacy)

The one-off script below was used for the initial production deploy. **New environments should use `npm run migrate` instead.**

```bash
node scripts/migrate-parent-accounts.js
```

The server also auto-creates `parent_accounts` / `parent_student_links` tables on startup if they are missing.

New student forms, imports, and approvals automatically link `father_email` to parent accounts when those tables exist.

## Cloud Build Configuration (`cloudbuild.yaml`)

The `cloudbuild.yaml` file automates the deployment pipeline using Google Cloud Build. It defines a series of steps to build, push, and deploy the application container to Google Cloud Run.

### Pipeline Steps Breakdown

1.  **Build Docker Image**
    ```yaml
    - name: 'gcr.io/cloud-builders/docker'
      args: ['build', '-t', 'gcr.io/$PROJECT_ID/asha-school-app-api', '.']
    ```
    *   **Action**: Builds a Docker image from the current directory (`.`).
    *   **Tagging**: Tags the image with `gcr.io/$PROJECT_ID/asha-school-app-api`, where `$PROJECT_ID` is automatically substituted by Cloud Build with your actual Google Cloud Project ID.

2.  **Push to Container Registry**
    ```yaml
    - name: 'gcr.io/cloud-builders/docker'
      args: ['push', 'gcr.io/$PROJECT_ID/asha-school-app-api']
    ```
    *   **Action**: Uploads the newly built image to Google Container Registry (GCR), making it accessible for deployment.

3.  **Deploy to Cloud Run**
    ```yaml
    - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
      entrypoint: gcloud
      args: ['run', 'deploy', 'asha-school-app-api', ...]
    ```
    *   **Action**: Deploys the image to Cloud Run.
    *   **Key Flags**:
        *   `--image`: Specifies the image URL from GCR.
        *   `--region asia-south1`: Deploys the service in the **Mumbai** region.
        *   `--platform managed`: Uses the fully managed Cloud Run platform.
        *   `--allow-unauthenticated`: Makes the API publicly accessible (remove this if you want to restrict access).

### Triggering the Build

To start the deployment process manually from your terminal:

```bash
gcloud builds submit --config cloudbuild.yaml .
```

### Importing Database

```bash

 gcloud sql import sql idcrm-db gs://id-crm-db-imports-asha-id-crm/IDCRM_APP/IDCRMPlainC.sql --database=idcrmn --user=postgres

```