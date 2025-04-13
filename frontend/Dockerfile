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

# Expose the port your dev server runs on (usually 3000)
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
