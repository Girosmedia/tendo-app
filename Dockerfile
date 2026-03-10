# 1. Usar una imagen oficial y súper ligera de Node.js 20
FROM node:20-alpine

# 2. Instalar pnpm y OpenSSL (Requerido por Prisma en Alpine)
RUN apk add --no-cache openssl
RUN npm install -g pnpm

# 3. Crear el directorio de trabajo
WORKDIR /app

# 4. Copiar los archivos de dependencias
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# 5. Instalar todas las dependencias de forma estricta con pnpm
RUN pnpm install --frozen-lockfile

# 6. Copiar el resto del código de la aplicación
COPY . .

# 7. === EL ENGAÑO (Variables dummy para que el build no llore) ===
ENV DATABASE_URL="postgresql://falso:falso@localhost:5432/falso"
ENV SKIP_ENV_VALIDATION="1"

# 8. Generar el cliente de Prisma
RUN pnpm dlx prisma generate

# 9. Construir la aplicación Next.js
RUN pnpm run build

# 10. Exponer el puerto
EXPOSE 3000

# 11. Comando para arrancar
CMD npx prisma migrate deploy && \
    npx tsx scripts/backfill-unit-costs.ts --apply && \
    npx tsx scripts/backfill-document-payments.ts --apply && \
    npx tsx scripts/backfill-treasury-movements.ts --apply && \
    pnpm start
