#!/bin/bash

echo "🚀 Tea वृक्ष POS - Quick Deploy Script"
echo "========================================"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "backend/package.json" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Please run this script from the FinalPOS directory"
    exit 1
fi

echo "✅ Found FinalPOS project structure"
echo ""

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Tea वृक्ष POS System"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

echo ""
echo "🌍 Next Steps for Global Deployment:"
echo "====================================="
echo ""
echo "1. 📝 Create GitHub repository:"
echo "   - Go to https://github.com"
echo "   - Click 'New repository'"
echo "   - Name it: tea-vriksha-pos"
echo "   - Make it PUBLIC (required for free hosting)"
echo ""
echo "2. 🔗 Connect to GitHub:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/tea-vriksha-pos.git"
echo "   git push -u origin main"
echo ""
echo "3. 🚀 Deploy to Railway (Recommended):"
echo "   - Go to https://railway.app"
echo "   - Sign up with GitHub"
echo "   - Deploy backend (root: backend)"
echo "   - Deploy frontend (root: frontend)"
echo ""
echo "4. 🌐 Or Deploy to Render (Alternative):"
echo "   - Go to https://render.com"
echo "   - Sign up with GitHub"
echo "   - Deploy backend as Web Service"
echo "   - Deploy frontend as Static Site"
echo ""
echo "📖 See detailed guides:"
echo "   - deploy-to-railway.md"
echo "   - deploy-to-render.md"
echo ""
echo "🎯 Result: Your brother in Nepal can access the POS system from anywhere!"
echo ""

# Check if backend is running
if curl -s http://localhost:4000 > /dev/null; then
    echo "✅ Backend is running on http://localhost:4000"
else
    echo "⚠️  Backend not running. Start with: cd backend && npm start"
fi

# Check if frontend is running
if curl -s http://localhost:5173 > /dev/null || curl -s http://localhost:5174 > /dev/null || curl -s http://localhost:5175 > /dev/null; then
    echo "✅ Frontend is running"
else
    echo "⚠️  Frontend not running. Start with: cd frontend && npm run dev"
fi

echo ""
echo "🌍 For global access, follow the deployment guides above!" 