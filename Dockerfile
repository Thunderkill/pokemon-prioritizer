# Use the official Nginx image as the base image
FROM nginx:stable-alpine

# Copy the HTML file to the Nginx HTML directory
COPY index.html /usr/share/nginx/html/index.html

# Expose the Nginx port
EXPOSE 80