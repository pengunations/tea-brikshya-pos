# 🚀 Railway Deployment Guide for Tea वृक्ष POS

## Quick Global Deployment for Your Brother in Nepal

### **Step 1: Sign Up for Railway**
1. Go to [railway.app](https://railway.app)
2. Click **"Sign Up"** 
3. Choose **"Continue with GitHub"**
4. Authorize Railway to access your GitHub account

### **Step 2: Deploy Backend First**
1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose: `pengunations/tea-brikshya-pos`
4. Set **Root Directory** to: `backend`
5. Click **"Deploy"**
6. Wait for deployment to complete
7. Copy the generated URL (e.g., `https://your-backend-name.railway.app`)

### **Step 3: Deploy Frontend**
1. In the same Railway project, click **"New Service"**
2. Select **"Deploy from GitHub repo"**
3. Choose: `pengunations/tea-brikshya-pos`
4. Set **Root Directory** to: `frontend`
5. Set **Build Command** to: `npm run build`
6. Set **Start Command** to: `npm run preview`
7. Click **"Deploy"**

### **Step 4: Configure Environment Variables**
**For Frontend Service:**
- Add environment variable: `VITE_API_URL` = `https://your-backend-url.railway.app`
- Replace with your actual backend URL from Step 2

### **Step 5: Get Your Global URL**
- **Backend URL**: `https://your-backend-name.railway.app`
- **Frontend URL**: `https://your-frontend-name.railway.app`

### **Step 6: Share with Your Brother**
Your brother can now access the POS system from Nepal by visiting the **Frontend URL** in any web browser!

## 🎯 What You'll Get
- ✅ **Global Access**: Works from anywhere in the world
- ✅ **24/7 Uptime**: Always available
- ✅ **Free Tier**: No cost for basic usage
- ✅ **Automatic Updates**: Deploys from your GitHub repository

## 🔧 Troubleshooting
- If deployment fails, check the logs in Railway dashboard
- Make sure all environment variables are set correctly
- The backend must be deployed before the frontend

## 📱 Your Brother's Access
Once deployed, your brother can:
1. Open any web browser
2. Go to your frontend URL
3. Login with admin/cashier credentials
4. Start using the POS system immediately!

---
**Estimated Time**: 10-15 minutes
**Cost**: Free (Railway free tier)
**Global Access**: ✅ Yes 