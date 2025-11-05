# Use an LTS Node image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm ci --only=production

# Copy application source
COPY . .

# Expose port (matches server.js default)
EXPOSE 4000

# Use environment variable for NODE_ENV; default to production in container
ENV NODE_ENV=production
ENV PORT=4000

# Start the application
CMD [ \"node\", \"server.js\" ]
