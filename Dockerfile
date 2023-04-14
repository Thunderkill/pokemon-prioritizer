# Build backend
FROM node:14 AS backend-build
WORKDIR /usr/src/app
COPY ./back/package*.json ./
RUN npm install
COPY ./back/ .

# Final stage
FROM node:14
WORKDIR /usr/src/app
COPY --from=backend-build /usr/src/app .

# Copy frontend files directly
COPY ./front/ ./front

# Expose both frontend and backend ports
EXPOSE 80 3000

# Install and configure Nginx
RUN apt-get update && apt-get install -y nginx
COPY ./nginx.conf /etc/nginx/sites-available/default

# Start Nginx and the backend server
CMD ["sh", "-c", "nginx && node app.js"]
