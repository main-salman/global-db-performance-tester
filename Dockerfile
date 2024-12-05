# Build stage
FROM node:18-alpine AS builder

# Install Terraform
RUN apk add --no-cache terraform

# Set working directory
WORKDIR /app

# Copy Terraform files
COPY *.tf ./
COPY *.tfvars ./
COPY .env* ./

# Copy application files
COPY package*.json ./
COPY next.config.js ./
COPY tsconfig.json ./
COPY pages ./pages
COPY styles ./styles
COPY public ./public

# Install dependencies
RUN npm ci

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/.env* ./

# Start the application
CMD ["npm", "start"]