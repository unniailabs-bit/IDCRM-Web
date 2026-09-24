# Implementation Plan - Running Cloud Build

This plan outlines the steps to execute the `cloudbuild.yaml` file to build and deploy your application to Google Cloud Run.

## 1. Prerequisites
Before running the build, ensure you have the following set up:

- **Google Cloud SDK**: Installed and initialized (`gcloud init`).
- **Authentication**: Authenticated with your Google account (`gcloud auth login`).
- **Project Selection**: Set the correct project ID:
  ```bash
  gcloud config set project [YOUR_PROJECT_ID]
  ```
- **APIs Enabled**: Ensure the following APIs are enabled in your project:
  - Cloud Build API (`cloudbuild.googleapis.com`)
  - Cloud Run API (`run.googleapis.com`)
  - Artifact Registry API (or Container Registry)

## 2. Service Account Permissions
The Cloud Build service account (typically `[PROJECT_NUMBER]@cloudbuild.gserviceaccount.com`) needs the following roles to deploy to Cloud Run:
- **Cloud Run Admin**: To create and update Cloud Run services.
- **Service Account User**: To act as the runtime service account for Cloud Run.

## 3. Execution Commands
The `cloudbuild.yaml` file uses a substitution variable `_SERVICE` to control what gets built and deployed.

### Option A: Deploy Everything (Backend & Frontend)
This is the default behavior.
```bash
gcloud builds submit --config cloudbuild.yaml .
```

### Option B: Deploy Backend Only
```bash
gcloud builds submit --config cloudbuild.yaml --substitutions=_SERVICE=backend .
```

### Option C: Deploy Frontend Only
*Note: This will try to fetch the URL of an existing `idcrm-backend` service.*
```bash
gcloud builds submit --config cloudbuild.yaml --substitutions=_SERVICE=frontend .
```

## 4. How it Works
1. **Backend**: Builds the Docker image from `./backend`, pushes it to GCR, and deploys it to Cloud Run.
2. **Backend URL**: Retrieves the dynamic URL of the deployed backend.
3. **Frontend**: Builds the Docker image from `./frontend`, passing the backend URL as a build argument (`VITE_BACKEND_URL`), and deploys it to Cloud Run.

## 5. Monitoring
- **CLI**: The command will output logs directly to your terminal.
- **Console**: You can monitor progress in the [Cloud Build History](https://console.cloud.google.com/cloud-build/builds) page.
- **Cloud Run**: Once complete, check your services in the [Cloud Run Console](https://console.cloud.google.com/run).
