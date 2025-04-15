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
