# Use an official Node.js runtime as a parent image
FROM node:18-bullseye-slim

# Install system dependencies needed for the bot (ffmpeg and webp)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libwebp-dev \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Your app binds to this port
EXPOSE 8000

# Define the command to run your app
CMD ["npm", "start"]