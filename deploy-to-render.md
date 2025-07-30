# 🚀 Deploy Tea वृक्ष POS to Render (Alternative - Works from Nepal)

## 🌍 Global Access Setup

This is an alternative to Railway. Render is also free and works globally!

## 📋 Prerequisites

1. **GitHub Account** (free)
2. **Render Account** (free) - [render.com](https://render.com)

## 🚀 Step-by-Step Deployment

### **Step 1: Create GitHub Repository**

1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name it: `tea-vriksha-pos`
4. Make it **Public** (required for free Render)
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

### **Step 3: Deploy Backend to Render**

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure the service:
   - **Name**: `tea-vriksha-pos-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. **Copy the URL** (e.g., `https://your-app-name.onrender.com`)

### **Step 4: Deploy Frontend to Render**

1. Click "New +" → "Static Site"
2. Connect your GitHub repository again
3. Configure the service:
   - **Name**: `tea-vriksha-pos-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Add **Environment Variable**:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.onrender.com` (from Step 3)
5. Click "Create Static Site"
6. Wait for deployment (3-5 minutes)
7. **Copy the frontend URL**

### **Step 5: Share with Your Brother**

Send the **frontend URL** to your brother in Nepal!

## 🔐 Login Credentials

- **Admin**: `admin` / `myMamu123`
- **Cashier**: `cashier` / `cashier`

## 🌍 Benefits

✅ **Works from anywhere** - Nepal, USA, anywhere!  
✅ **No installation** - Just open a web browser  
✅ **Always updated** - Changes deploy automatically  
✅ **Mobile friendly** - Works on phones too  
✅ **Free hosting** - No cost to you  
✅ **Fast deployment** - Usually 5-10 minutes  

## 📱 What Your Brother Needs

- **Any device** with internet (computer, phone, tablet)
- **Any web browser** (Chrome, Safari, Firefox)
- **The URL** you send him

## 🎯 Quick Setup (5 minutes)

1. **Create GitHub repo** and upload code
2. **Deploy backend** on Render (5 minutes)
3. **Deploy frontend** on Render (3 minutes)
4. **Share URL** with brother

## 💡 Pro Tips

1. **Render is very reliable** for small projects
2. **Free tier includes** 750 hours/month
3. **Automatic deployments** when you push to GitHub
4. **Good documentation** and support

## 🆘 Troubleshooting

1. **Check build logs** if deployment fails
2. **Verify environment variables** are set correctly
3. **Make sure repository is public** (required for free tier)
4. **Wait 5-10 minutes** for first deployment

This will give your brother a professional POS system accessible from Nepal! 🌍 