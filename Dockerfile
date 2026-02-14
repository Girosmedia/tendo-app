# 1. Usar una imagen oficial y súper ligera de Node.js 20
FROM node:20-alpine

# 2. Instalar OpenSSL (Requerido por Prisma en Alpine)
RUN apk add --no-cache openssl

# 3. Crear el directorio de trabajo
WORKDIR /app

# 4. Copiar los archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# 5. Instalar todas las dependencias
RUN npm ci

# 6. Copiar el resto del código de la aplicación
COPY . .

# 7. Generar el cliente de Prisma
RUN npx prisma generate

# 8. Construir la aplicación Next.js
RUN npm run build

# 9. Exponer el puerto
EXPOSE 3000

# 10. Comando para arrancar (Migrar y luego iniciar Next.js)
CMD npx prisma migrate deploy && npm start
