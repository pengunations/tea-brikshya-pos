# 🚀 Deploy Tea वृक्ष POS to Cloud for Global Access

## ⚠️ **IMPORTANT: Current Setup is LOCAL ONLY**

Your current setup (`http://10.0.0.161:5173`) only works on your local WiFi network. 
**Your brother in Nepal CANNOT access this!**

To make it work globally, we need to deploy to Railway.

---

## ☁️ **Railway Deployment (Global Access)**

### **Step 1: Go to Railway**
1. **Open your browser**
2. **Go to**: [railway.app](https://railway.app)
3. **Click "Sign Up"**
4. **Choose "Continue with GitHub"** (since your code is on GitHub)
5. **Authorize Railway** to access your GitHub account

### **Step 2: Deploy Backend**
1. **Click "New Project"**
2. **Select "Deploy from GitHub repo"**
3. **Choose your repository**: `pengunations/tea-brikshya-pos`
4. **Set Root Directory to**: `backend`
5. **Click "Deploy"**
6. **Wait for deployment to complete** (about 2-3 minutes)
7. **Copy the generated URL** (it will look like `https://your-backend-name.railway.app`)

### **Step 3: Deploy Frontend**
1. **In the same Railway project**, click **"New Service"**
2. **Select "Deploy from GitHub repo"**
3. **Choose your repository**: `pengunations/tea-brikshya-pos`
4. **Set Root Directory to**: `frontend`
5. **Add Environment Variable**:
   - **Name**: `VITE_API_URL`
   - **Value**: Use the backend URL from Step 2
6. **Click "Deploy"**

### **Step 4: Get Your Global URL**
- Your frontend will get a URL like: `https://tea-vrikshya-pos.railway.app`
- **This will work from ANYWHERE in the world!** 🌍

---

## 🌟 **What You'll Get:**

| Feature | Local Setup | Railway Deployment |
|---------|-------------|-------------------|
| **Access** | Same WiFi only | **Anywhere in world** |
| **URL** | `http://10.0.0.161:5173` | `https://tea-vrikshya-pos.railway.app` |
| **Computer Needed** | ✅ Yes | ❌ No |
| **Works from Nepal** | ❌ No | ✅ **Yes!** |
| **24/7 Uptime** | ❌ No | ✅ Yes |
| **Professional** | ❌ No | ✅ Yes |

---

## 🎯 **For Your Brother in Nepal:**

**Current setup**: ❌ Won't work (different country)
**Railway deployment**: ✅ **Will work perfectly!**

Your brother will get a professional URL like:
`https://tea-vrikshya-pos.railway.app`

**Ready to deploy? Go to [railway.app](https://railway.app) now!** 🚀 