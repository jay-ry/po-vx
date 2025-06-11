#!/bin/bash
set -e

# Create a clean production build directory
echo "Creating production build directory..."
rm -rf dist
mkdir -p dist

# Copy package files
echo "Copying package files..."
cp package.json dist/
cp package-lock.json dist/
cp tsconfig.json dist/
cp drizzle.config.ts dist/
cp theme.json dist/
cp vite.config.ts dist/
cp tailwind.config.ts dist/
cp postcss.config.js dist/

# Copy source code
echo "Copying source code..."
cp -r server dist/
cp -r shared dist/
cp -r client dist/
cp -r uploads dist/ 2>/dev/null || mkdir -p dist/uploads

# Create production .env from example
echo "Creating production .env..."
cat > dist/.env << EOL
# Database
DATABASE_URL=your_database_url_here

# Session
SESSION_SECRET=your_session_secret_here

# Optional - OpenAI integration
OPENAI_API_KEY=your_openai_api_key_here
EOL

# Create ecosystem.config.js for PM2
echo "Creating PM2 config..."
cat > dist/ecosystem.config.js << EOL
module.exports = {
  apps: [
    {
      name: 'vx-academy',
      script: 'node_modules/.bin/tsx',
      args: 'server/index.ts',
      instances: 'max',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
EOL

# Create deploy instructions
echo "Creating deploy instructions..."
cat > dist/README.md << EOL
# VX Academy Deployment

## Requirements
- Node.js 20+
- PostgreSQL 15+
- PM2 (for production process management)

## Setup Instructions

1. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

2. Configure environment variables:
   Edit the \`.env\` file and set your production values:
   - DATABASE_URL: Your PostgreSQL connection string
   - SESSION_SECRET: A secure random string for session encryption
   - OPENAI_API_KEY: (Optional) for AI tutor functionality

3. Start the server using PM2:
   \`\`\`
   npm install -g pm2
   pm2 start ecosystem.config.js
   \`\`\`

4. The application will be available on port 5000 by default.
   Configure Nginx or another web server to proxy requests to this port.

## AWS Specific Setup

For AWS deployment, consider:

1. RDS for PostgreSQL database
2. EC2 instances for the application (t3.medium recommended)
3. ELB for load balancing (if using multiple instances)
4. Route 53 for domain management
5. S3 for storing assets and backups
EOL

# Create an AWS deploy guide
echo "Creating AWS deploy guide..."
cat > dist/AWS-DEPLOY-GUIDE.md << EOL
# AWS Deployment Guide for VX Academy

## AWS Architecture

We recommend the following AWS services:

1. **EC2** for application hosting
   - t3.medium (or larger) instances
   - Amazon Linux 2023 or Ubuntu 22.04
   - Auto Scaling Group for high availability

2. **RDS** for PostgreSQL database
   - db.t3.medium (minimum)
   - Multi-AZ setup for production
   - Automated backups

3. **S3** for asset storage and backups

4. **Application Load Balancer (ALB)** for traffic distribution

5. **Route 53** for DNS management

6. **CloudFront** for content delivery (optional)

## Deployment Steps

### 1. Database Setup
1. Create an RDS PostgreSQL instance
2. Configure security groups to allow connections from EC2 instances
3. Create the application database

### 2. EC2 Instance Setup
1. Launch an EC2 instance with Amazon Linux 2023 or Ubuntu 22.04
2. SSH into the instance
3. Install Node.js 20:
   \`\`\`
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   \`\`\`
4. Install PM2:
   \`\`\`
   npm install -g pm2
   \`\`\`
5. Upload the application files to the instance
6. Configure the \`.env\` file with your RDS connection string and secrets
7. Install dependencies and start the application:
   \`\`\`
   npm install
   pm2 start ecosystem.config.js
   \`\`\`
8. Set up PM2 to restart on system reboot:
   \`\`\`
   pm2 startup
   pm2 save
   \`\`\`

### 3. Load Balancer Setup
1. Create an Application Load Balancer
2. Configure listeners for HTTP (80) and HTTPS (443)
3. Set up target groups pointing to your EC2 instances
4. Configure health checks to monitor instance health

### 4. DNS Setup (Route 53)
1. Create a hosted zone for your domain
2. Create an A record pointing to your load balancer
3. Configure SSL certificates using AWS Certificate Manager

### 5. Auto Scaling (Optional)
1. Create an AMI from your configured instance
2. Create a Launch Configuration using this AMI
3. Create an Auto Scaling Group using this Launch Configuration
4. Configure scaling policies based on CPU utilization or custom metrics

## Monitoring and Maintenance

- Set up CloudWatch alarms for system metrics
- Configure logs to be sent to CloudWatch Logs
- Set up regular database backups
- Plan for regular security updates
EOL

# Create a zip file of the distribution
echo "Creating zip file..."
cd dist
zip -r ../vx-academy-aws-deploy.zip .

echo "Deploy package created successfully: vx-academy-aws-deploy.zip"
echo "Inside the package you'll find AWS-DEPLOY-GUIDE.md with detailed deployment instructions."