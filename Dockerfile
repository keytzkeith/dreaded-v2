# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Install system dependencies needed by the bot (replaces Heroku buildpacks)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libwebp-dev \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install app dependencies
RUN npm install --omit=dev

# Bundle app source
COPY . .

# Command to run your bot
CMD ["node", "index.js"]