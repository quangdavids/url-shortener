# Use Node image
FROM node:18

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Environment variable setup (if any)
ENV PORT=5000

# Expose backend port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
