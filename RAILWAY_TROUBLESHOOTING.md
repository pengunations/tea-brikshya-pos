# 🔧 Railway Deployment Troubleshooting Guide

## Common Issues and Solutions

### **Issue 1: "Build Failed"**
**Solution:**
1. Check Railway logs in the dashboard
2. Make sure you're using the correct root directory:
   - **Backend**: `backend`
   - **Frontend**: `frontend`

### **Issue 2: "Port Already in Use"**
**Solution:**
✅ **FIXED** - I've updated your backend to use `process.env.PORT || 4000`

### **Issue 3: "Environment Variables Not Set"**
**Solution:**
1. Go to your Railway service
2. Click on "Variables" tab
3. Add these variables:

**For Backend:**
- `PORT`: `4000` (or leave empty - Railway will set it automatically)
- `NODE_ENV`: `production`

**For Frontend:**
- `VITE_API_URL`: `https://your-backend-url.railway.app`

### **Issue 4: "Cannot Find Module"**
**Solution:**
1. Make sure you're in the correct directory
2. Check that `package.json` exists in the root directory you specified

### **Issue 5: "Build Command Failed"**
**Solution:**
1. For Frontend, use:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run preview`

2. For Backend, use:
   - **Build Command**: (leave empty)
   - **Start Command**: `npm start`

## 🚀 Step-by-Step Deployment

### **Step 1: Deploy Backend**
1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose: `pengunations/tea-brikshya-pos`
5. Set **Root Directory** to: `backend`
6. Click **"Deploy"**
7. Wait for deployment to complete
8. Copy the generated URL

### **Step 2: Deploy Frontend**
1. In the same project, click **"New Service"**
2. Select **"Deploy from GitHub repo"**
3. Choose: `pengunations/tea-brikshya-pos`
4. Set **Root Directory** to: `frontend`
5. Set **Build Command** to: `npm run build`
6. Set **Start Command** to: `npm run preview`
7. Click **"Deploy"**

### **Step 3: Configure Environment Variables**
**For Frontend Service:**
1. Go to your frontend service
2. Click **"Variables"** tab
3. Add: `VITE_API_URL` = `https://your-backend-url.railway.app`
4. Replace with your actual backend URL

## 🔍 Debugging Steps

### **Check Logs:**
1. Go to your Railway service
2. Click **"Deployments"** tab
3. Click on the latest deployment
4. Check the logs for errors

### **Common Error Messages:**

**"Module not found"**
- Check if you're in the right directory
- Make sure `package.json` exists

**"Port already in use"**
- ✅ Fixed - Backend now uses `process.env.PORT`

**"Build failed"**
- Check if all dependencies are in `package.json`
- Make sure build commands are correct

**"Environment variable not found"**
- Add the required environment variables in Railway dashboard

## 📞 Need Help?

If you're still having issues:

1. **Check the logs** in Railway dashboard
2. **Make sure** you're using the correct root directories
3. **Verify** environment variables are set correctly
4. **Try redeploying** after making changes

## 🎯 Quick Test

Once deployed, test your backend by visiting:
`https://your-backend-url.railway.app`

You should see: "POS Backend is running"

Then test your frontend by visiting:
`https://your-frontend-url.railway.app`

You should see your POS login screen! 