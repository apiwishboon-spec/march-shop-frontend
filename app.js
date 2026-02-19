/*************************************************
 * ART&INK SHOP – AUTO QR VERSION (2-STEP PROCESS)
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

  // Initialize step 1
  updateTotal();
});

// ================================
// STEP NAVIGATION
// ================================
function goToStep1() {
  hideAllSteps();
  document.getElementById("step1").classList.add("active");
  document.getElementById("step1-indicator").classList.add("active");
  document.getElementById("step2-indicator").classList.remove("completed");
}

function goToStep2() {
  // Validate contact form
  const email = document.getElementById("email").value.trim();
  const qty = document.getElementById("qty").value;

  if (!email || !email.includes("@")) {
    showError("Please enter a valid email address.");
    return;
  }

  if (!qty || qty < 1 || qty > 5) {
    showError("Please select a valid quantity (1-5).");
    return;
  }

  // Transition to step 2
  hideAllSteps();
  document.getElementById("step2").classList.add("active");
  document.getElementById("step1-indicator").classList.remove("active");
  document.getElementById("step1-indicator").classList.add("completed");
  document.getElementById("step2-indicator").classList.add("active");

  // Generate QR for payment step
  generateQR();
}

function hideAllSteps() {
  document.querySelectorAll(".step-content").forEach(step => {
    step.classList.remove("active");
  });
  document.querySelectorAll(".step").forEach(step => {
    step.classList.remove("active", "completed");
  });
}

// ================================
// UPDATE TOTAL
// ================================
function updateTotal() {
  const price = parseFloat(localStorage.getItem("price"));
  const qty = Number(document.getElementById("qty").value);
  const total = price * (qty || 1);

  // Update display if we're on payment step
  const qrTotalElement = document.getElementById("qrTotal");
  if (qrTotalElement) {
    qrTotalElement.textContent = "฿" + total;
  }
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
    showError("QR generation failed: " + err.message);
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
// DOWNLOAD BUTTON (FIXED)
// ================================
function enableDownload(imageUrl) {
  // Use existing download button instead of creating new one
  const downloadBtn = document.getElementById("downloadQR");
  if (downloadBtn) {
    downloadBtn.href = imageUrl;
    downloadBtn.download = "promptpay-qr.png";
    downloadBtn.style.display = "inline-block";
  }
}

// ================================
// TURNSTILE CALLBACK
// ================================
function onTurnstileSuccess(token) {
  turnstileToken = token;
}

// ================================
// SUBMIT ORDER (WITH LOADING)
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

  // Show loading state
  const submitBtn = document.getElementById("submitBtn");
  const btnText = submitBtn.querySelector(".btn-text");
  submitBtn.classList.add("btn-loading");
  submitBtn.disabled = true;
  btnText.textContent = "Submitting...";

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
      // Reset button state on error
      submitBtn.classList.remove("btn-loading");
      submitBtn.disabled = false;
      btnText.textContent = "Submit Order";
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
  // Create or update error message
  let errorElement = document.getElementById("error");
  if (!errorElement) {
    errorElement = document.createElement("div");
    errorElement.id = "error";
    errorElement.style.cssText = "background:#f8d7da;color:#721c24;padding:12px;border-radius:8px;margin-bottom:20px;display:none;";
    document.querySelector(".container").insertBefore(errorElement, document.querySelector("main"));
  }
  
  errorElement.textContent = message;
  errorElement.style.display = "block";
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorElement.style.display = "none";
  }, 5000);
}
