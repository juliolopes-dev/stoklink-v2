# Dockerfile único - Backend + Frontend
FROM node:20-alpine AS frontend-builder

# Instalar dependências do sistema
RUN apk add --no-cache openssl

WORKDIR /app/frontend

# Copiar e buildar frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Backend builder
FROM node:20-alpine AS backend-builder

# Instalar dependências do sistema para Prisma
RUN apk add --no-cache openssl openssl-dev

WORKDIR /app/backend

# Copiar arquivos de dependências
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY backend/ ./
RUN npm run build

# Imagem final de produção
FROM node:20-alpine AS production

# Instalar dependências do sistema para Prisma runtime
RUN apk add --no-cache openssl

WORKDIR /app

# Copiar backend compilado
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/prisma ./prisma
COPY --from=backend-builder /app/backend/package*.json ./

# Copiar frontend buildado para pasta public
COPY --from=frontend-builder /app/frontend/dist ./public

# Expor porta
EXPOSE 3333

ENV NODE_ENV=production
ENV PORT=3333

# Rodar migrations e iniciar servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
