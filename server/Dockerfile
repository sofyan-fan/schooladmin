# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Copy the rest of the application's code to the working directory
COPY . .

# Make the entrypoint script executable
RUN chmod +x docker-entrypoint.sh

# The command to run when the container starts
ENTRYPOINT ["/bin/sh", "./docker-entrypoint.sh"]

# The default command if no command is specified to the entrypoint
CMD ["npm", "run", "dev"] 