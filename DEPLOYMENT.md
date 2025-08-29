# Blood Bank Management System - Deployment Guide

This guide provides comprehensive instructions for deploying your MERN stack Blood Bank Management System to various platforms.

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB)
- Git repository
- Domain name (optional)

## 🏗️ Project Structure

```
Blood-Bank-Management-System-Project/
├── src/                    # React frontend source
├── server/                 # Express backend
├── dist/                   # Built frontend (after build)
├── package.json           # Frontend dependencies & scripts
├── vite.config.ts         # Vite configuration
├── docker-compose.yml     # Docker production setup
├── Dockerfile            # Production Docker image
└── .env.production       # Production environment variables
```

## 🔧 Environment Setup

### Frontend Environment Variables
Create `.env.production` in the root directory:

```env
VITE_API_BASE_URL=https://your-backend-url.com/api
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBL6A54WzFMaweUCdpUOoZxHJqmmw5fAQ8
```

### Backend Environment Variables
Update `server/.env.production`:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_jwt_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
CLIENT_URL=https://your-frontend-url.com
ALLOWED_ORIGINS=https://your-frontend-url.com
```

## 🚀 Deployment Options

### Option 1: Railway (Recommended for Full Stack)

1. **Prepare your project:**
   ```bash
   npm run deploy:prepare
   ```

2. **Create Railway account:** Visit [railway.app](https://railway.app)

3. **Deploy steps:**
   - Connect your GitHub repository
   - Railway will auto-detect your Node.js app
   - Set environment variables in Railway dashboard
   - Deploy with one click

4. **Environment variables to set in Railway:**
   - `NODE_ENV=production`
   - `MONGODB_URI` (your MongoDB Atlas connection string)
   - `JWT_SECRET`
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - `CLIENT_URL` (will be your Railway URL)

### Option 2: Render (Great for Backend + Static Frontend)

1. **Backend Deployment:**
   - Create new Web Service on [render.com](https://render.com)
   - Connect your repository
   - Set build command: `npm run build:server`
   - Set start command: `npm start`
   - Set working directory: `server`
   - Add all environment variables

2. **Frontend Deployment:**
   - Create new Static Site
   - Set build command: `npm run build`
   - Set publish directory: `dist`

### Option 3: Vercel (Frontend) + Railway/Render (Backend)

1. **Frontend on Vercel:**
   ```bash
   npm install -g vercel
   npm run build
   vercel --prod
   ```

2. **Backend on Railway/Render:**
   Follow Option 1 or 2 for backend only

### Option 4: Heroku

1. **Install Heroku CLI**

2. **Create Heroku app:**
   ```bash
   heroku create your-blood-bank-app
   ```

3. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI="your_mongodb_connection_string"
   heroku config:set JWT_SECRET="your_jwt_secret"
   # ... add all other env vars
   ```

4. **Deploy:**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

### Option 5: Docker Deployment

1. **Build and run with Docker:**
   ```bash
   # Build the image
   docker build -t blood-bank-app .
   
   # Run the container
   docker run -p 5000:5000 --env-file server/.env.production blood-bank-app
   ```

2. **Or use Docker Compose:**
   ```bash
   docker-compose up --build
   ```

### Option 6: VPS/Self-Hosted

1. **Server setup:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PM2 for process management
   npm install -g pm2
   ```

2. **Deploy application:**
   ```bash
   # Clone repository
   git clone https://github.com/your-username/blood-bank-app.git
   cd blood-bank-app
   
   # Install and build
   npm run deploy:prepare
   
   # Start with PM2
   cd server
   pm2 start ecosystem.config.js --env production
   ```

## 🔄 Build Commands

- `npm run build:client` - Build React frontend
- `npm run build:server` - Install server dependencies
- `npm run build:full` - Build both frontend and backend
- `npm run deploy:prepare` - Full deployment preparation
- `npm run start:prod` - Start production server

## ✅ Post-Deployment Checklist

1. **Test the application:**
   - Visit your deployed URL
   - Test user registration/login
   - Check blood donation features
   - Verify admin dashboard

2. **Security checks:**
   - Ensure all sensitive data is in environment variables
   - Test CORS settings
   - Verify HTTPS is working (if using custom domain)

3. **Performance optimization:**
   - Enable gzip compression
   - Set up CDN (CloudFlare, etc.)
   - Monitor application performance

## 🔧 Troubleshooting

### Common Issues:

1. **Build fails:**
   - Check Node.js version compatibility
   - Ensure all dependencies are installed
   - Verify environment variables

2. **CORS errors:**
   - Update `CLIENT_URL` in backend environment
   - Check `allowedOrigins` configuration

3. **Database connection fails:**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist settings in MongoDB Atlas
   - Ensure firewall allows outbound connections

4. **Google Maps not loading:**
   - Verify `VITE_GOOGLE_MAPS_API_KEY` is set
   - Check API key permissions in Google Cloud Console

## 📊 Monitoring

### Health Check Endpoint:
- `GET /api/health` - Returns server status

### Logs:
- Check application logs in your hosting platform dashboard
- Use `pm2 logs` for VPS deployments

## 🔒 Security Notes

1. **Never commit `.env` files to version control**
2. **Use strong JWT secrets (minimum 256 bits)**
3. **Regularly rotate API keys and secrets**
4. **Enable HTTPS in production**
5. **Keep dependencies updated**

## 🌐 Custom Domain Setup

1. **Purchase domain** from any registrar
2. **Configure DNS:**
   - Add A record pointing to server IP
   - Or add CNAME record to hosting platform
3. **Set up SSL certificate** (Let's Encrypt, CloudFlare)
4. **Update environment variables** with new domain

---

## Quick Start Commands

```bash
# Local production test
npm run deploy:local

# Build for deployment
npm run deploy:prepare

# Docker deployment
docker-compose up --build

# Check if everything is working
curl http://localhost:5000/api/health
```

Choose the deployment option that best fits your needs and budget. Railway and Render are excellent for beginners, while VPS deployment offers more control for advanced users.
