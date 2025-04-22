# Base image
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy entire source code into container
COPY . .

# Expose the port your app listens on
EXPOSE 6001

# Start the application
CMD ["node", "index.js"]
