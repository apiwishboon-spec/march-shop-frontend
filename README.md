# 🎨 Chromink

**Premium artwork shirts screen-printed in Thailand with limited drops and real artists.**

Chromink is a modern Progressive Web App (PWA) e-commerce platform featuring Thailand PromptPay QR payment integration, Google Apps Script backend, and a fully mobile-responsive design.

---

## 🚀 Features

### 🛒 **E-Commerce**
- **Product Catalog** - Beautiful artwork shirt showcase with detailed descriptions
- **Multi-step Checkout** - Clean, intuitive order flow with progress indicators
- **Static Thailand PromptPay QR** - Simple payment integration
- **Slip Upload System** - Secure payment verification via ImgBB
- **Order Management** - Complete order tracking and admin dashboard

### 📱 **Progressive Web App**
- **Installable** - Works as native app on iOS, Android, and desktop
- **Offline Capable** - Essential features work without internet
- **Push Notifications** - Alert customers about new designs and updates
- **App Shortcuts** - Quick access to browse and order pages
- **Splash Screen** - Professional loading experience

### 📱 **Mobile-First Design**
- **Fully Responsive** - Optimized for all screen sizes (320px to 4K)
- **Touch-Optimized** - 44px minimum touch targets for better usability
- **Mobile Navigation** - Hamburger menu with smooth animations
- **Dark Mode Support** - Automatic theme detection
- **Accessibility** - Reduced motion, proper focus states, keyboard navigation

### ⚙️ **Admin Dashboard**
- **Order Management** - View, verify, and manage all orders
- **Analytics** - Sales statistics and visual charts
- **Email Marketing** - Custom newsletter campaigns
- **Real-time Updates** - Auto-refresh with live data
- **Mobile Admin** - Full admin functionality on mobile devices

### 🎨 **User Experience**
- **Beautiful Design** - Modern gradient effects and smooth animations
- **Product Popups** - Interactive product galleries with multiple images
- **Size Selection** - Visual size picker with availability indicators
- **Newsletter Signup** - Email subscription with modern UI
- **Legal Pages** - Comprehensive privacy policy and terms of service

---

## 🧠 Tech Stack

### **Frontend**
- **HTML5** - Semantic markup with PWA support
- **CSS3** - Modern responsive design with animations
- **Vanilla JavaScript** - No frameworks, pure JS implementation
- **GSAP** - Professional animation library
- **Chart.js** - Data visualization for admin dashboard

### **Backend**
- **Google Apps Script** - API mode for order processing
- **ImgBB** - Secure image storage for payment slips
- **Email Service** - Automated notifications and marketing

### **PWA Features**
- **Service Worker** - Offline functionality and caching
- **Web App Manifest** - Installable app configuration
- **Push API** - Notification system

---

## 💳 Payment Flow

1. **Browse Products** - Customer selects artwork shirts
2. **View Details** - Interactive product galleries and information
3. **Place Order** - Multi-step form with size selection
4. **Payment QR** - Static PromptPay QR code displayed
5. **Complete Payment** - Customer pays via banking app
6. **Upload Slip** - Payment proof uploaded to ImgBB
7. **Order Confirmation** - Data sent to Google Apps Script
8. **Admin Verification** - Manual payment confirmation
9. **Order Fulfillment** - Shipping and delivery coordination

---

## 📂 Project Structure

```
├── 📄 Core Pages
│   ├── index.html          # Homepage with product catalog
│   ├── order.html           # Multi-step checkout flow
│   ├── admin.html           # Admin dashboard
│   ├── faq.html             # Frequently asked questions
│   ├── story.html           # Brand story and about
│   ├── privacy.html         # Privacy policy
│   ├── term.html            # Terms of service
│   ├── success.html         # Order confirmation
│   └── 404.html             # Error page
│
├── 🎨 Assets & Styles
│   ├── style.css            # Comprehensive responsive CSS
│   ├── app.js               # Main application logic
│   ├── copyright.js         # Dynamic copyright
│   ├── chromink-icon.png     # App icon and branding
│   └── manifest.json        # PWA configuration
│
├── ⚙️ PWA Components
│   ├── sw.js                # Service worker for offline functionality
│   └── browserconfig.xml    # Microsoft PWA support
│
└── 📋 Documentation
    ├── README.md            # This file
    ├── DEPLOYMENT.md        # Deployment guide
    └── LICENSE              # MIT License
```

---

## 🚀 Getting Started

### **Prerequisites**
- Modern web browser with PWA support
- Google Apps Script backend setup
- ImgBB API key for image storage

### **Installation**
1. Clone the repository
2. Configure Google Apps Script backend
3. Set up ImgBB API integration
4. Deploy to web hosting
5. Install as PWA on mobile devices

### **Development**
```bash
# Serve locally for development
python -m http.server 8000
# or use any static web server
```

---

## 📱 PWA Installation

### **Mobile (iOS/Android)**
1. Visit the website in mobile browser
2. Tap "📱 Install Chromink App" button
3. Confirm installation
4. App appears on home screen

### **Desktop (Chrome/Edge)**
1. Visit website in desktop browser
2. Click install icon in address bar
3. Confirm installation
4. App launches in standalone window

---

## 🎯 Key Features Highlight

### **🛍️ Shopping Experience**
- **Product Gallery** - High-quality images with zoom
- **Size Guide** - Interactive size selection
- **Real-time Stock** - Availability indicators
- **Wishlist** - Save favorite designs

### **📊 Admin Capabilities**
- **Live Dashboard** - Real-time order statistics
- **Email Campaigns** - Custom newsletter designer
- **Analytics** - Sales trends and customer insights
- **Bulk Operations** - Efficient order management

### **🎨 Design Excellence**
- **Gradient Effects** - Modern visual aesthetics
- **Micro-interactions** - Hover states and transitions
- **Typography** - Optimized readability across devices
- **Color Scheme** - Consistent branding throughout

---

## 📜 License

MIT License © 2026 Chromink

---

## ⚠️ Important Notes

- **Manual Payment Verification** - Admin confirms each payment
- **Google Apps Script Backend** - Not publicly exposed API
- **PWA Online Mode** - Requires internet for full functionality
- **Mobile-First Design** - Optimized primarily for mobile experience
- **Thailand Focus** - Designed for Thai market and PromptPay

---

## 🌟 What Makes Chromink Special

✅ **No Complex Payment Gateways** - Simple QR-based system  
✅ **No Heavy Frameworks** - Lightweight and fast  
✅ **No Backend Complexity** - Google Apps Script handles everything  
✅ **Full PWA Experience** - Installable native app feel  
✅ **Mobile-First Design** - Perfect for smartphone shopping  
✅ **Admin Dashboard** - Complete management system  
✅ **Beautiful UI/UX** - Modern, professional design  
✅ **Offline Capable** - Works without internet connection  

---

**🎨 Chromink - Where Art Meets Everyday Life**
