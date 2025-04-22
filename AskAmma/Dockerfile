# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy dependency files and install
COPY package*.json ./
RUN npm install

# Copy the rest of the source
COPY . .

# Expose app port
EXPOSE 7001

# Run the server
CMD ["node", "server.js"]
