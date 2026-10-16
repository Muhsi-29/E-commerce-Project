# ---- Build stage: compile the React app to static files ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# These addresses are built into the JavaScript, so they're set at build time
ARG VITE_API_URL=http://localhost:5000/api/v1
ARG VITE_ADMIN_URL=http://localhost:5174
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ADMIN_URL=$VITE_ADMIN_URL
RUN npm run build

# ---- Runtime stage: serve the files with Nginx ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
