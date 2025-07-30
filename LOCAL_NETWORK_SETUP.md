# Tea वृक्ष POS - Local Network Setup

## 🌐 Quick Local Network Access

This is the easiest way to let your brother access the POS system from his device on the same network.

## 📋 Prerequisites

- Both devices (your computer + brother's device) on same WiFi network
- Your computer running the servers

## 🚀 Step-by-Step Setup

### **Step 1: Find Your Computer's IP Address**

Run this command in Terminal:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Look for something like: `192.168.1.100` or `10.0.0.50`

### **Step 2: Start the Servers**

Open **Terminal 1**:
```bash
cd backend && npm start
```

Open **Terminal 2**:
```bash
cd frontend && npm run dev -- --host
```

### **Step 3: Access from Brother's Device**

Your brother can now access the POS system by opening a web browser and going to:

**`http://YOUR_IP_ADDRESS:5173`**

For example: `http://192.168.1.100:5173`

## 🔧 Troubleshooting

### **If it doesn't work:**

1. **Check firewall settings**:
   - Go to System Preferences → Security & Privacy → Firewall
   - Make sure it's not blocking the connections

2. **Try different port**:
   - If port 5173 is busy, try: `http://YOUR_IP:5174` or `http://YOUR_IP:5175`

3. **Check network**:
   - Make sure both devices are on the same WiFi network

## 📱 Benefits

✅ **No Installation** - Brother just opens a web browser  
✅ **No Deployment** - No need for online hosting  
✅ **Fast Setup** - Works in 5 minutes  
✅ **Secure** - Only accessible on your local network  
✅ **Same Features** - All POS functionality works  

## 🔐 Login Credentials

- **Admin**: `admin` / `myMamu123`
- **Cashier**: `cashier` / `cashier`

## 💡 Pro Tips

1. **Bookmark the URL** on your brother's device for easy access
2. **Keep your computer running** when he needs to use it
3. **Use a static IP** if possible for consistent access

## 🎯 Quick Commands

```bash
# Find your IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Start backend
cd backend && npm start

# Start frontend (in new terminal)
cd frontend && npm run dev -- --host
```

Then share the URL: `http://YOUR_IP:5173`

This is much simpler than the desktop app and will work reliably! 🌐 