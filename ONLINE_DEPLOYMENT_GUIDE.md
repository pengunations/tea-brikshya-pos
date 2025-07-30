# Tea वृक्ष POS - Online Deployment Guide

## 🌐 Online Deployment Options

Your brother can access the POS system through a web browser instead of the desktop app. Here are the best options:

### **Option 1: Railway (Recommended - Free)**
1. **Sign up** at [railway.app](https://railway.app)
2. **Deploy backend**:
   - Connect your GitHub repository
   - Set root directory to `backend`
   - Add environment variable: `PORT=4000`
3. **Deploy frontend**:
   - Create new service
   - Set root directory to `frontend`
   - Add environment variable: `VITE_API_URL=https://your-backend-url.railway.app`

### **Option 2: Render (Free Tier)**
1. **Sign up** at [render.com](https://render.com)
2. **Deploy backend**:
   - Create new Web Service
   - Connect GitHub repository
   - Set build command: `npm install && npm start`
   - Set start command: `node index.js`
3. **Deploy frontend**:
   - Create new Static Site
   - Set build command: `npm run build`
   - Set publish directory: `dist`

### **Option 3: Vercel (Free)**
1. **Sign up** at [vercel.com](https://vercel.com)
2. **Deploy backend**:
   - Import your GitHub repository
   - Set root directory to `backend`
   - Add environment variables
3. **Deploy frontend**:
   - Import your GitHub repository
   - Set root directory to `frontend`
   - Add environment variable: `VITE_API_URL=https://your-backend-url.vercel.app`

## 🔧 Quick Setup Steps

### **Step 1: Prepare Repository**
```bash
# Create a new repository on GitHub
# Upload your FinalPOS project
```

### **Step 2: Deploy Backend**
1. Go to Railway/Render/Vercel
2. Connect your GitHub repository
3. Set the backend directory
4. Deploy and get the URL

### **Step 3: Deploy Frontend**
1. Create a new service for frontend
2. Set environment variable: `VITE_API_URL=https://your-backend-url`
3. Deploy and get the frontend URL

### **Step 4: Share with Brother**
- Send the frontend URL to your brother
- He can access it from any device with internet
- No installation required!

## 📱 Benefits of Online Version

✅ **No Installation** - Works on any device with internet  
✅ **Always Updated** - Changes are deployed instantly  
✅ **Cross-Platform** - Works on Mac, Windows, Linux, Mobile  
✅ **No Security Issues** - No "developer not verified" warnings  
✅ **Easy Access** - Just open a web browser  

## 🔐 Login Credentials (Same as Desktop)

- **Admin**: `admin` / `myMamu123`
- **Cashier**: `cashier` / `cashier`

## 🚀 Recommended: Railway Deployment

Railway is the easiest option:

1. **Backend Deployment**:
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Set root directory to `backend`
   - Deploy

2. **Frontend Deployment**:
   - Create new service in same project
   - Set root directory to `frontend`
   - Add environment variable: `VITE_API_URL=https://your-backend-url.railway.app`
   - Deploy

3. **Share URL**:
   - Send the frontend URL to your brother
   - He can start using it immediately!

## 💡 Alternative: Local Network

If you want to keep it local but accessible from other devices:

1. **Find your computer's IP address**:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **Start the servers**:
   ```bash
   # Terminal 1
   cd backend && npm start
   
   # Terminal 2  
   cd frontend && npm run dev
   ```

3. **Access from other devices**:
   - Backend: `http://YOUR_IP:4000`
   - Frontend: `http://YOUR_IP:5173`

## 🎯 Quick Start (Railway)

1. **Deploy Backend**:
   - Railway → New Project → GitHub
   - Select repo → Set root: `backend`
   - Deploy → Copy URL

2. **Deploy Frontend**:
   - Same project → New Service
   - Set root: `frontend`
   - Environment: `VITE_API_URL=https://your-backend-url`
   - Deploy → Copy URL

3. **Share URL** with your brother!

The online version will be much more reliable than the desktop app! 🌐 