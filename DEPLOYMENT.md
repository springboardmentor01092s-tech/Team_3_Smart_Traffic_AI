# Deployment Guide

This covers running TrafficVision AI locally with Docker, and deploying it
to AWS or Azure.

## 1. Run locally with Docker Compose

Requires Docker and Docker Compose installed.

```bash
# from the project root
cp .env.example .env
# edit .env: set real values for POSTGRES_PASSWORD and SECRET_KEY at minimum

docker compose up --build
```

This starts three services:

| Service  | URL                         | Notes                          |
|----------|------------------------------|---------------------------------|
| frontend | http://localhost:3000        | React app, served via nginx    |
| backend  | http://localhost:8000/docs   | FastAPI, interactive API docs  |
| db       | localhost:5432                | Postgres (internal use)        |

Stop everything with `docker compose down` (add `-v` to also drop the
Postgres volume and start clean).

### First-time data
The app starts with an empty database. Either register users through the
UI (`/register`) or reuse `Backend/seed_users.py` — point it at the same
`DATABASE_URL` used by the backend container and run it once:

```bash
docker compose exec backend python seed_users.py
```

## 2. Deploy to the cloud

The containers built above are exactly what you deploy — no code changes
needed, only where the images run and how services find each other.

### Option A — Single VM (fastest path, either cloud)
1. Provision a small VM (AWS EC2 or Azure VM), install Docker + Docker
   Compose.
2. Copy the repo (or just `Backend/`, `frontend/`, `docker-compose.yml`,
   `.env`) to the VM.
3. Set real production values in `.env` — in particular:
   - `SECRET_KEY`: a long random string (`openssl rand -hex 32`)
   - `POSTGRES_PASSWORD`: a strong password
   - `ALLOWED_ORIGINS`: your public frontend URL
   - `REACT_APP_API_URL`: your public backend URL (used at frontend build time)
4. `docker compose up --build -d`
5. Put a reverse proxy / load balancer (nginx, or the cloud's own
   AWS ALB / Azure Application Gateway) in front, with TLS termination,
   pointing to the frontend (port 3000→80) and backend (port 8000).

### Option B — Managed services (more scalable, more setup)

**AWS**
- Backend: push `Backend/Dockerfile` image to ECR, run on ECS Fargate or
  Elastic Beanstalk (Docker platform).
- Frontend: either serve via the same ECS/Fargate pattern, or build the
  static output (`npm run build`) and host it on S3 + CloudFront instead
  of the nginx container.
- Database: Amazon RDS for PostgreSQL — set `DATABASE_URL` to the RDS
  endpoint instead of the `db` compose service.

**Azure**
- Backend: push the image to Azure Container Registry, run on Azure
  Container Apps or App Service (Docker/Linux container option).
- Frontend: Azure Static Web Apps (from the `npm run build` output) or the
  same container-app approach as the backend.
- Database: Azure Database for PostgreSQL — set `DATABASE_URL` accordingly.

In both cases the backend only needs three environment variables to run
anywhere: `DATABASE_URL`, `SECRET_KEY`, and `ALLOWED_ORIGINS`. The frontend
needs `REACT_APP_API_URL` set at build time (it's baked into the static
JS, so it can't be changed after the image is built — rebuild the image
if the backend URL changes).

## 3. Health checks

Both Dockerfiles define a `HEALTHCHECK`:
- Backend: `GET /` should return `{"message": "TrafficVision AI System API is running smoothly."}`
- Frontend: `GET /` on port 80 should return the React app's `index.html`

Use these same checks for your cloud load balancer / container platform's
health probes.

## 4. Rolling back
Since everything is stateless except the Postgres volume, redeploying an
older image tag on `backend`/`frontend` is a safe rollback — the database
schema is additive (SQLAlchemy `create_all`) and doesn't need a separate
migration rollback step at this stage of the project.
