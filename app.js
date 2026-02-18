/*************************************************
 * ART&INK SHOP – AUTO QR VERSION
 *************************************************/

let turnstileToken = null;
let generatedPayload = null;
let qrTimer = null;
let qrExpiryTime = null;

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

  const formData = new URLSearchParams();
  formData.append("email", "preview@shop.com"); // dummy
  formData.append("phone", "");
  formData.append("item", item);
  formData.append("price", price);
  formData.append("quantity", qty);

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

    const qrImg = document.getElementById("dynamicQR");
    // Add cache busting timestamp and higher error correction for security
    const qrUrlWithCache = data.data.qrImage + "&v=" + Date.now() + "&ecc=H";
    qrImg.src = qrUrlWithCache;

    // Start 5-minute timer
    startQRTimer();

    document.getElementById("qrTotal").textContent =
      "฿" + data.data.total;

    enableDownload(qrUrlWithCache);
  })
  .catch(err => {
    console.error("QR failed:", err.message);
  });
}


// ================================
// QR TIMER FUNCTION
// ================================
function startQRTimer() {
  // Clear existing timer
  if (qrTimer) {
    clearInterval(qrTimer);
  }

  // Set expiry time (5 minutes from now)
  qrExpiryTime = Date.now() + (5 * 60 * 1000);
  
  // Update timer display every second
  qrTimer = setInterval(() => {
    const now = Date.now();
    const remaining = Math.max(0, qrExpiryTime - now);
    
    if (remaining === 0) {
      // QR expired
      clearInterval(qrTimer);
      expireQR();
    } else {
      // Update timer display
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      updateTimerDisplay(minutes, seconds);
    }
  }, 1000);
}

function updateTimerDisplay(minutes, seconds) {
  let timerElement = document.getElementById("qrTimer");
  if (!timerElement) {
    timerElement = document.createElement("div");
    timerElement.id = "qrTimer";
    timerElement.style.cssText = "text-align:center; margin-top:10px; font-weight:bold; color:#e74c3c;";
    document.getElementById("dynamicQR").parentElement.appendChild(timerElement);
  }
  
  if (minutes === 0 && seconds <= 30) {
    timerElement.style.color = "#e74c3c";
    timerElement.innerHTML = `⏰ QR expires in ${seconds}s`;
  } else {
    timerElement.style.color = "#f39c12";
    timerElement.innerHTML = `⏰ QR expires in ${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

function expireQR() {
  const qrImg = document.getElementById("dynamicQR");
  qrImg.style.opacity = "0.3";
  qrImg.style.filter = "blur(5px)";
  
  const timerElement = document.getElementById("qrTimer");
  if (timerElement) {
    timerElement.innerHTML = "⏰ QR Expired - Please refresh";
    timerElement.style.color = "#e74c3c";
  }
  
  showError("QR code expired. Please refresh to generate a new one.");
}

// ================================
// DOWNLOAD BUTTON
// ================================
function enableDownload(imageUrl) {
  // Remove existing download button to prevent duplicates
  const existingBtn = document.getElementById("downloadQR");
  if (existingBtn) {
    existingBtn.remove();
  }

  // Create new download button
  const btn = document.createElement("a");
  btn.id = "downloadQR";
  btn.className = "btn-secondary";
  btn.style.display = "inline-block";
  btn.style.marginTop = "10px";
  btn.textContent = "Download QR";
  btn.download = "promptpay-qr.png";
  btn.href = imageUrl;

  document.getElementById("dynamicQR")
    .parentElement
    .appendChild(btn);
}


// ================================
// TURNSTILE CALLBACK
// ================================
function onTurnstileSuccess(token) {
  turnstileToken = token;
  console.log("Turnstile verified successfully");
  
  // Update status indicator
  const statusElement = document.getElementById("turnstile-status");
  if (statusElement) {
    statusElement.innerHTML = "✅ Verification complete";
    statusElement.style.color = "#27ae60";
  }
  
  // Clear any existing error messages when verification succeeds
  const errorElement = document.getElementById("error");
  if (errorElement) {
    errorElement.style.display = "none";
  }
}

// ================================
// RESET TURNSTILE (for troubleshooting)
// ================================
function resetTurnstile() {
  turnstileToken = null;
  
  const statusElement = document.getElementById("turnstile-status");
  if (statusElement) {
    statusElement.innerHTML = "🔄 Resetting verification...";
    statusElement.style.color = "#f39c12";
  }
  
  // Reload Turnstile widget
  setTimeout(() => {
    if (window.turnstile) {
      window.turnstile.reset();
    }
    statusElement.innerHTML = "🔒 Please complete verification above";
    statusElement.style.color = "#666";
  }, 1000);
}


// ================================
// SUBMIT ORDER
// ================================
function submitOrder() {

  console.log("Submit order called");
  console.log("Turnstile token:", turnstileToken ? "exists" : "missing");

  if (!turnstileToken) {
    console.log("No turnstile token found");
    return showError("Please verify you are human. Complete the verification challenge above.");
  }

  const slipInput = document.getElementById("slip");

  if (!slipInput.files.length)
    return showError("Please upload payment slip.");

  const file = slipInput.files[0];

  if (file.size > 5 * 1024 * 1024)
    return showError("Slip too large (max 5MB).");

  console.log("All validations passed, submitting order...");

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

function showError(message) {
  const error = document.getElementById("error");
  error.textContent = message;
  error.style.display = "block";
}



