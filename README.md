# 🔒 Meme360 - Secure Solana Memecoin Tracker

A secure, full-stack application for tracking Solana memecoins with hidden API keys and real-time price data.

## 🛡️ Security Features

- **✅ API Key Protected**: Hidden in server-side `.env` file, never exposed to users
- **✅ Backend Proxy**: Secure Node.js server acts as proxy to BitQuery API
- **✅ No Client-Side Secrets**: Frontend only calls secure local endpoints
- **✅ Environment Variables**: Sensitive config stored in `.env` file
- **✅ Git Protection**: `.gitignore` prevents accidental key commits

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` file with your BitQuery API key:
```
BITQUERY_API_KEY=your_api_key_here
PORT=3001
```

### 3. Start Secure Server
```bash
npm start
```

### 4. Access Application
Open: http://localhost:3001

## 📁 Project Structure

```
meme360/
├── server.js          # 🔒 Secure backend (API key hidden here)
├── package.json       # Dependencies
├── .env              # 🔒 Secret config (never commit!)
├── .gitignore        # Protects sensitive files
├── public/           # Frontend files (served by Express)
│   ├── index.html
│   ├── script.js     # 🔒 Secure frontend (no API keys)
│   ├── styles.css
│   └── assets/
└── README.md
```

## 🔐 How Security Works

### Before (Insecure):
```javascript
// ❌ API key exposed in frontend
const API_KEY = 'ory_at_JE31cTmW2...'; // Anyone can see this!
```

### After (Secure):
```javascript
// ✅ Frontend calls secure backend
const response = await fetch('/api/tokens'); // No API key needed!

// ✅ Backend handles API securely (server.js)
const API_KEY = process.env.BITQUERY_API_KEY; // Hidden in .env
```

## 🌐 API Endpoints

- **GET `/api/tokens`** - Fetch Solana memecoin data (secure proxy)
- **GET `/api/health`** - Server health check

## 🎯 Features

- **Real-time Data**: Live Solana memecoin prices via BitQuery
- **Coin360 Style**: Visual heatmap with market cap sizing
- **Dynamic Colors**: Intensity based on price change percentage
- **Dual Layouts**: Box view and table view
- **Smart Tooltips**: Auto-positioning to prevent cutoff
- **Mobile Responsive**: Works on all devices
- **Click Integration**: Direct links to Dexscreener

## 🔧 Development

```bash
# Install with auto-restart
npm install -g nodemon
npm run dev

# Production
npm start
```

## 🚨 Security Notes

1. **Never commit `.env`** - It contains your API key!
2. **Keep server running** - Frontend needs backend for data
3. **Use HTTPS in production** - Encrypt all communications
4. **Rotate API keys** - Change keys periodically for security

## 🌍 Deployment

For production deployment:
1. Deploy backend server (Heroku, DigitalOcean, etc.)
2. Set environment variables on hosting platform
3. Update frontend API calls to production URL
4. Never expose `.env` file publicly

---

🎉 **Your API is now completely secure!** Users can't see or steal your BitQuery key.