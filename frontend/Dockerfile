# Dev-oriented Dockerfile for local docker-compose full-stack testing.
# Production deployment uses Vercel directly (see README Phase 14 section),
# which builds and serves the app itself — this Dockerfile is NOT used
# in that path, only for `docker compose up` locally.

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
