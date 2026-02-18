# 🚀 Production Deployment Guide

## Quick Start Commands

### 1. Initialize Git Repository
```bash
cd /Users/boon/Desktop/code/march-shop-frontend-main
git init
git add .
git commit -m "🚀 Initial commit - Dynamic PromptPay QR System"
```

### 2. Push to GitHub
```bash
git remote add origin https://github.com/apiwishboon-spec/march-shop-frontend.git
git branch -M main
git push -u origin main
```

### 3. Enable GitHub Pages
1. Go to: https://github.com/apiwishboon-spec/march-shop-frontend/settings/pages
2. Source: Deploy from a branch
3. Branch: main / (root)
4. Click Save
5. Wait 2-5 minutes for deployment

### 4. Access Your Live Site
```
https://apiwishboon-spec.github.io/march-shop-frontend/
```

---

## ⚠️ BACKEND DEPLOYMENT (Manual)

### Step 1: Copy Backend Code
1. Open: `/Users/boon/Desktop/code/march-shop-frontend-main/backend/code.gs`
2. Copy entire contents (Ctrl+A, Ctrl+C)
3. Go to: https://script.google.com
4. Click "New Project"
5. Paste code (Ctrl+V)
6. Save project (Ctrl+S)

### Step 2: Configure Properties
In Google Apps Script, run this once:
```javascript
function setProperties() {
  PropertiesService.getScriptProperties().setProperties({
    'TURNSTILE_SECRET': 'your_cloudflare_secret_here',
    'IMGBB_KEY': 'your_imgbb_api_key_here'
  });
  Logger.log('Properties set successfully');
}
```

### Step 3: Deploy Web App
1. Click "Deploy" → "New deployment"
2. Type: Web app
3. Execute as: Me
4. Who has access: Anyone
5. Click "Deploy"
6. Copy Web app URL

### Step 4: Update Frontend API URL
1. Edit `frontend/app.js` line 8
2. Replace with your deployment URL:
```javascript
const API_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
```

### Step 5: Test QR Generation
Run in Google Apps Script console:
```javascript
testPromptPayQR()
```

---

## 🔧 Required Configurations

### Cloudflare Turnstile
1. Sign up: https://cloudflare.com/products/turnstile
2. Add site
3. Copy site key
4. Update `order.html` line 65:
```html
data-sitekey="YOUR_SITE_KEY_HERE"
```

### ImgBB API
1. Sign up: https://imgbb.com/api
2. Get API key
3. Set in Google Apps Script properties

### Google Sheets
1. Create new spreadsheet
2. Copy sheet ID from URL
3. Update `SHEET_ID` in backend code

---

## 🧪 Production Testing Checklist

- [ ] Frontend loads on GitHub Pages
- [ ] QR generates without errors
- [ ] QR scans with KBank app
- [ ] QR scans with SCB app
- [ ] Payment slip uploads successfully
- [ ] Order submission works
- [ ] Email notifications sent
- [ ] Google Sheets updated

---

## 🚨 Important Security Notes

1. **NEVER commit backend code to Git** (already handled by .gitignore)
2. **NEVER hardcode API keys** (use Google Apps Script properties)
3. **ALWAYS test with small amounts first**
4. **KEEP your Google Apps Script deployment private**
5. **MONITOR for suspicious activity**

---

## 📞 Support

If you encounter issues:
1. Check Google Apps Script logs
2. Verify all API keys are correct
3. Test QR generation with `testPromptPayQR()`
4. Check browser console for frontend errors

---

## ✅ Deployment Complete!

Your Dynamic PromptPay QR system is now:
- ✅ Frontend live on GitHub Pages
- ✅ Backend deployed on Google Apps Script
- ✅ EMVCo compliant QR generation
- ✅ Ready for production use

🎉 **Your shop is ready for business!**
