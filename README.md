# ART&INK

ART&INK is a lightweight web-based shop system using Thailand PromptPay QR payment and a Google Apps Script backend for order processing.

This project focuses on simplicity, manual verification, and clean checkout flow without complex payment gateways or webhooks.

---

## 🚀 Features

* Static Thailand PromptPay QR payment
* Slip upload system
* Image storage via ImgBB
* Order submission via Google Apps Script
* Email notification workflow
* Clean multi-page checkout flow

---

## 🧠 Tech Stack

Frontend:

* HTML
* CSS
* JavaScript

Backend:

* Google Apps Script (API mode)
* ImgBB (slip image storage)

No Node.js.
No payment gateway.
No webhook automation.

---

## 💳 Payment Flow

1. User selects product
2. Static PromptPay QR is displayed
3. User completes payment via banking app
4. User uploads payment slip
5. Slip is uploaded to ImgBB
6. Order data is sent to Google Apps Script
7. Admin manually verifies payment

---

## 📂 Project Structure

```
LICENSE
QR_payment.jpg
app.js
index.html
order.html
success.html
style.css
```

---

## 📜 License

MIT License © 2026 ART&INK

---

## ⚠️ Notes

* This system does not include automatic payment confirmation.
* Backend is powered by Google Apps Script and is not publicly exposed.
* Payment verification is manual.
