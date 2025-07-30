# 🚀 Deploy Tea वृक्ष POS to Railway (Works from Nepal)

## 🌍 Global Access Setup

This will create a web version that your brother can access from Nepal or anywhere in the world!

## 📋 Prerequisites

1. **GitHub Account** (free)
2. **Railway Account** (free) - [railway.app](https://railway.app)

## 🚀 Step-by-Step Deployment

### **Step 1: Create GitHub Repository**

1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name it: `tea-vriksha-pos`
4. Make it **Public** (required for free Railway)
5. Click "Create repository"

### **Step 2: Upload Your Code**

```bash
# In your FinalPOS folder
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tea-vriksha-pos.git
git push -u origin main
```

### **Step 3: Deploy Backend to Railway**

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your `tea-vriksha-pos` repository
6. Set **Root Directory** to: `backend`
7. Click "Deploy"
8. Wait for deployment to complete
9. **Copy the URL** (e.g., `https://your-app-name.railway.app`)

### **Step 4: Deploy Frontend to Railway**

1. In the same Railway project, click "New Service"
2. Select "Deploy from GitHub repo"
3. Choose your `tea-vriksha-pos` repository again
4. Set **Root Directory** to: `frontend`
5. Add **Environment Variable**:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.railway.app` (from Step 3)
6. Click "Deploy"
7. Wait for deployment to complete
8. **Copy the frontend URL**

### **Step 5: Share with Your Brother**

Send the **frontend URL** to your brother in Nepal. He can now access the POS system from anywhere!

## 🔐 Login Credentials

- **Admin**: `admin` / `myMamu123`
- **Cashier**: `cashier` / `cashier`

## 🌍 Benefits

✅ **Works from anywhere** - Nepal, USA, anywhere!  
✅ **No installation** - Just open a web browser  
✅ **Always updated** - Changes deploy instantly  
✅ **Mobile friendly** - Works on phones too  
✅ **Free hosting** - No cost to you  

## 📱 What Your Brother Needs

- **Any device** with internet (computer, phone, tablet)
- **Any web browser** (Chrome, Safari, Firefox)
- **The URL** you send him

## 🎯 Quick Commands (Alternative)

If you prefer command line:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy backend
cd backend
railway init
railway up

# Deploy frontend
cd ../frontend
railway init
railway up
```

## 💡 Pro Tips

1. **Bookmark the URL** on your brother's devices
2. **Test it yourself** before sending to him
3. **Keep the URLs** for future updates
4. **Railway is free** for small projects like this

## 🆘 If Something Goes Wrong

1. **Check Railway logs** for errors
2. **Verify environment variables** are set correctly
3. **Make sure repository is public** (required for free tier)
4. **Contact Railway support** if needed

This will give your brother a professional, reliable POS system that works from Nepal! 🌍 