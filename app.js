/*************************************************
 * ART&INK SHOP – AUTO QR VERSION
 *************************************************/

let turnstileToken = null;
let generatedPayload = null;
let qrExpirationTime = null;
let countdownInterval = null;
let qrTimestamp = null;

const API_URL = "https://script.google.com/macros/s/AKfycbxENBG6cKm3ImJd_6gjvxCUnM-hG0xeNhPhjLUleDCyh0JsXhkkG7wOwkBjRW43j-88mg/exec";

document.addEventListener("DOMContentLoaded", () => {

  const item = localStorage.getItem("item");
  const price = parseFloat(localStorage.getItem("price"));

  if (!item || !price) {
    location.href = "index.html";
    return;
  }

  document.getElementById("item-text").textContent =
    `${item} — ฿${price} each`;

  updateTotal();
  generateQR();

  document.getElementById("qty")
    .addEventListener("input", () => {
      updateTotal();
      generateQR();
    });

  document.getElementById("submitBtn")
    .addEventListener("click", submitOrder);
});


// ================================
// UPDATE TOTAL
// ================================
function updateTotal() {
  const price = parseFloat(localStorage.getItem("price"));
  const qty = Number(document.getElementById("qty").value);
  const total = price * (qty || 1);

  document.getElementById("qrTotal").textContent = "฿" + total;
}


// ================================
// GENERATE QR (NO EMAIL REQUIRED)
// ================================
function generateQR() {

  const qty = Number(document.getElementById("qty").value);
  const price = parseFloat(localStorage.getItem("price"));
  const item = localStorage.getItem("item");

  if (!qty || qty < 1) return;

  const timestamp = Date.now().toString();

  const formData = new URLSearchParams();
  formData.append("email", "preview@shop.com"); // dummy
  formData.append("phone", "");
  formData.append("item", item);
  formData.append("price", price);
  formData.append("quantity", qty);
  formData.append("timestamp", timestamp); // Add timestamp for security

  fetch(API_URL, {
    method: "POST",
    body: formData
  })
  .then(res => res.json())
  .then(data => {

    if (!data.success) {
      throw new Error(data.message);
    }

    generatedPayload = data.data.promptPayPayload;
    qrTimestamp = timestamp;
    qrExpirationTime = parseInt(data.data.expiresAt) || (qrTimestamp + (5 * 60 * 1000));

    const qrImg = document.getElementById("dynamicQR");
    const qrUrlWithCache = data.data.qrImage + "&v=" + qrTimestamp;
    qrImg.src = qrUrlWithCache;

    document.getElementById("qrTotal").textContent =
      "฿" + data.data.total;

    enableDownload(qrUrlWithCache);
    startCountdown();
    addSecondDownloadButton(qrUrlWithCache);
  })
  .catch(err => {
    console.error("QR failed:", err.message);
    showError("QR generation failed: " + err.message);
  });
}


// ================================
// DOWNLOAD BUTTON
// ================================
function enableDownload(imageUrl) {

  let btn = document.getElementById("downloadQR");

  if (!btn) {
    btn = document.createElement("a");
    btn.id = "downloadQR";
    btn.className = "btn-secondary";
    btn.style.display = "inline-block";
    btn.style.marginTop = "10px";
    btn.textContent = "Download QR";
    btn.download = "promptpay-qr.png";

    document.getElementById("dynamicQR")
      .parentElement
      .appendChild(btn);
  }

  btn.href = imageUrl;
}


// ================================
// TURNSTILE CALLBACK
// ================================
function onTurnstileSuccess(token) {
  turnstileToken = token;
}


// ================================
// SUBMIT ORDER
// ================================
function submitOrder() {

  if (!turnstileToken)
    return showError("Please verify you are human.");

  const slipInput = document.getElementById("slip");

  if (!slipInput.files.length)
    return showError("Upload payment slip.");

  const file = slipInput.files[0];

  if (file.size > 5 * 1024 * 1024)
    return showError("Slip too large (max 5MB).");

  const reader = new FileReader();

  reader.onload = function () {

    const base64Image = reader.result.split(",")[1];

    const formData = new URLSearchParams();
    formData.append("email", document.getElementById("email").value.trim());
    formData.append("phone", document.getElementById("phone").value.trim());
    formData.append("item", localStorage.getItem("item"));
    formData.append("price", localStorage.getItem("price"));
    formData.append("quantity", document.getElementById("qty").value);
    formData.append("base64Image", base64Image);
    formData.append("turnstileToken", turnstileToken);
    formData.append("timestamp", qrTimestamp); // Include QR timestamp for validation

    fetch(API_URL, {
      method: "POST",
      body: formData
    })
    .then(res => res.json())
    .then(data => {

      if (!data.success) {
        throw new Error(data.message);
      }

      const orderId = data.data?.orderId || Date.now();
      localStorage.clear();
      location.href = "success.html?id=" + orderId;


    })
    .catch(err => {
      showError(err.message || "Submission failed");
    });
  };

  reader.readAsDataURL(file);
}


// ================================
function cancelOrder() {
  localStorage.clear();
  location.href = "index.html";
}

// ================================
// COUNTDOWN TIMER
// ================================
function startCountdown() {
  // Clear existing countdown
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  // Create or update countdown display
  let countdownDiv = document.getElementById("qrCountdown");
  if (!countdownDiv) {
    countdownDiv = document.createElement("div");
    countdownDiv.id = "qrCountdown";
    countdownDiv.style.cssText = `
      background: #ff6b6b;
      color: white;
      padding: 10px 15px;
      border-radius: 8px;
      margin-top: 15px;
      font-weight: bold;
      text-align: center;
      font-size: 14px;
    `;
    document.getElementById("dynamicQR").parentElement.appendChild(countdownDiv);
  }

  countdownInterval = setInterval(() => {
    const now = Date.now();
    const timeLeft = qrExpirationTime - now;

    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      countdownDiv.textContent = "⏰ QR Code Expired - Please Refresh";
      countdownDiv.style.background = "#dc3545";
      disableQRSubmission();
      return;
    }

    const minutes = Math.floor(timeLeft / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    countdownDiv.textContent = `⏱️ QR expires in: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Change color when time is running out
    if (timeLeft < 60000) { // Less than 1 minute
      countdownDiv.style.background = "#dc3545";
      countdownDiv.textContent = `⚠️ QR expires in: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }, 1000);
}

// ================================
// SECOND DOWNLOAD BUTTON
// ================================
function addSecondDownloadButton(imageUrl) {
  // Remove existing second button if any
  const existingBtn = document.getElementById("downloadQR2");
  if (existingBtn) {
    existingBtn.remove();
  }

  const btn = document.createElement("a");
  btn.id = "downloadQR2";
  btn.className = "btn-secondary";
  btn.style.cssText = `
    display: inline-block;
    margin-top: 10px;
    margin-left: 10px;
    background: #28a745;
    border-color: #28a745;
  `;
  btn.textContent = "📥 Save QR";
  btn.download = `promptpay-qr-${qrTimestamp}.png`;
  btn.href = imageUrl;

  // Insert after first download button
  const firstBtn = document.getElementById("downloadQR");
  if (firstBtn) {
    firstBtn.parentNode.insertBefore(btn, firstBtn.nextSibling);
  }
}

// ================================
// DISABLE QR SUBMISSION
// ================================
function disableQRSubmission() {
  const qrImg = document.getElementById("dynamicQR");
  qrImg.style.opacity = "0.3";
  qrImg.style.filter = "blur(2px)";
  
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "QR Expired - Refresh Page";
  submitBtn.style.background = "#6c757d";
  
  // Show refresh button
  const refreshBtn = document.createElement("button");
  refreshBtn.className = "btn-primary";
  refreshBtn.style.cssText = "margin-left: 10px; background: #007bff;";
  refreshBtn.textContent = "🔄 Refresh QR";
  refreshBtn.onclick = () => location.reload();
  
  submitBtn.parentNode.insertBefore(refreshBtn, submitBtn.nextSibling);
}

function showError(message) {
  const error = document.getElementById("error");
  error.textContent = message;
  error.style.display = "block";
}



