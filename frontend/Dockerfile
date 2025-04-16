# Base image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy entire project
COPY . .

# Build the production app
RUN npm run build

# Install `serve` to serve the production build
RUN npm install -g serve

# Expose the port your app will run on
EXPOSE 3000

# Start the production server
CMD ["serve", "-s", "build", "-l", "3000"]

# # Stage 1: Build the React (or Vite) app
# FROM node:18 AS build

# # Set working directory
# WORKDIR /usr/src/app

# # Install dependencies
# COPY package*.json ./
# RUN npm install

# # Copy app source
# COPY . .

# # Build the app
# RUN npm run build

# # Stage 2: Serve with NGINX
# FROM nginx:alpine

# # Clean default HTML files
# RUN rm -rf /usr/share/nginx/html/*

# # Copy built files to NGINX web dir
# COPY --from=build /usr/src/app/build /usr/share/nginx/html

# # Copy custom NGINX config
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# # Expose HTTP
# EXPOSE 80

# # Start NGINX
# CMD ["nginx", "-g", "daemon off;"]

