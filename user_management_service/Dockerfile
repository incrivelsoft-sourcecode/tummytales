# Use an official Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port (ensure it matches your app's port)
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
