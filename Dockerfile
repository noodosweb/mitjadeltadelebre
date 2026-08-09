FROM node:22-alpine AS build
WORKDIR /app
ARG PUBLIC_GA4_MEASUREMENT_ID
ENV PUBLIC_GA4_MEASUREMENT_ID=$PUBLIC_GA4_MEASUREMENT_ID
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
