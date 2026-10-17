# Stage 1: Build Angular application
FROM node:20-alpine AS build
WORKDIR /app

# Instalar dependencias
COPY frontend/package*.json ./
RUN npm install

# Copiar codigo fonte e compilar aplicacao
COPY frontend/ ./
RUN npm run build

# Stage 2: Servir aplicacao com Nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
