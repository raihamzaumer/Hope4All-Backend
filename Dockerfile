# Step 1: Use an official Node.js runtime as the base image
# Node 20 LTS is stable and widely compatible
FROM node:20-alpine

# Step 2: Set the working directory inside the container
WORKDIR /usr/src/app

# Step 3: Copy package.json and package-lock.json first
# This allows Docker to cache your dependencies if they haven't changed
COPY package*.json ./

# Step 4: Install dependencies
# Using 'npm ci' is faster and safer for automated environments than 'npm install'
RUN npm ci --only=production

# Step 5: Copy the rest of your application code
COPY . .

# Step 6: Expose the port your app runs on
EXPOSE 5001

# Step 7: Define the command to run your app
# Use node directly instead of nodemon for production
CMD ["node", "index.js"]