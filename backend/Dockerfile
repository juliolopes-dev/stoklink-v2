# Backend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci

# Gerar cliente Prisma
RUN npx prisma generate

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Imagem de produção
FROM node:20-alpine AS production

WORKDIR /app

# Copiar arquivos necessários
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Expor porta
EXPOSE 3333

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3333

# Comando para iniciar (apenas gera o cliente Prisma e inicia o servidor)
CMD ["sh", "-c", "npx prisma generate && node dist/server.js"]
