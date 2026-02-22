/*************************************************
 * ART&INK SHOP – AUTO QR VERSION (2-STEP PROCESS)
 *************************************************/

let turnstileToken = null;
let generatedPayload = null;
let qrTimer = null;
let qrExpiryTime = null;
let selectedPaymentMethod = 'promptpay';

const API_URL = "https://script.google.com/macros/s/AKfycbxENBG6cKm3ImJd_6gjvxCUnM-hG0xeNhPhjLUleDCyh0JsXhkkG7wOwkBjRW43j-88mg/exec";

document.addEventListener("DOMContentLoaded", function() {
  const item = localStorage.getItem("item");
  const price = parseFloat(localStorage.getItem("price"));
  const selectedSize = localStorage.getItem("selectedSize") || 'M';

  console.log('Loading order page with:', { item, price, selectedSize });

  if (!item || !price) {
    console.log('Missing item or price, redirecting to index');
    location.href = "index.html";
    return;
  }

  // Initialize step 1
  updateOrderSummary(item, price, selectedSize);
  
  // Setup payment method listeners
  setupPaymentMethods();
});

// ================================
// ORDER SUMMARY & DISCOUNT
// ================================
function updateOrderSummary(item, price, size) {
  console.log('Updating order summary with:', { item, price, size });
  
  const productElement = document.getElementById('summary-product');
  const priceElement = document.getElementById('summary-price');
  const sizeElement = document.getElementById('summary-size');
  
  console.log('Found elements:', { productElement, priceElement, sizeElement });
  
  if (productElement) {
    productElement.textContent = item;
    console.log('Set product to:', item);
  }
  
  if (priceElement) {
    priceElement.textContent = price;
    console.log('Set price to:', price);
  }
  
  if (sizeElement) {
    sizeElement.textContent = size;
    console.log('Set size to:', size);
  }
  
  updateTotalPrice(price);
}

function updateTotalPrice(basePrice) {
  const qty = Number(document.getElementById("qty").value);
  const total = basePrice * qty;
  document.getElementById('summary-total').textContent = total.toFixed(2);
}

// ================================
// PAYMENT METHODS
// ================================
function setupPaymentMethods() {
  const promptpayRadio = document.getElementById('promptpay');
  const cashRadio = document.getElementById('cash');
  
  promptpayRadio.addEventListener('change', () => {
    if (promptpayRadio.checked) {
      selectedPaymentMethod = 'promptpay';
      showPromptPaySection();
    }
  });
  
  cashRadio.addEventListener('change', () => {
    if (cashRadio.checked) {
      selectedPaymentMethod = 'cash';
      showCashSection();
    }
  });
}

function showPromptPaySection() {
  document.getElementById('promptpay-section').style.display = 'block';
  document.getElementById('cash-section').style.display = 'none';
  
  // Show regular total, hide cash total
  const cashTotalRow = document.getElementById('cashTotalRow');
  const summaryTotal = document.getElementById('summary-total').parentElement.parentElement;
  if (cashTotalRow && summaryTotal) {
    cashTotalRow.style.display = 'none';
    summaryTotal.style.display = 'flex';
  }
  
  // Show slip upload
  const slipLabel = document.getElementById('slipLabel');
  if (slipLabel) {
    slipLabel.style.display = 'block';
  }
  
  // Show turnstile for PromptPay orders
  const turnstile = document.querySelector('.cf-turnstile');
  if (turnstile) {
    turnstile.style.display = 'block';
  }
  
  // Ensure buttons are visible
  const buttonRow = document.querySelector('.button-row');
  if (buttonRow) {
    buttonRow.style.display = 'flex';
  }
  
  updateTotalPrice(parseFloat(localStorage.getItem("price")));
}

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

function cancelOrder() {
  if (confirm('Are you sure you want to cancel this order?')) {
    localStorage.clear();
    window.location.href = 'index.html';
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
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const item = localStorage.getItem("item");
  const price = parseFloat(localStorage.getItem("price"));
  const qty = Number(document.getElementById("qty").value);
  const size = localStorage.getItem("selectedSize") || 'M';

  if (!item || price <= 0 || qty < 1) {
    showError("Invalid order data");
    return;
  }

  if (!email) {
    showError("Email is required");
    return;
  }

  const submitBtn = document.getElementById("submitBtn");
  const btnText = submitBtn.querySelector("span") || submitBtn;
  
  // Show loading state
  submitBtn.classList.add("btn-loading");
  submitBtn.disabled = true;
  if (btnText) btnText.textContent = "Processing...";

  // PromptPay QR - generate QR code
  console.log('Starting PromptPay order submission...');
  
  // Check if we have the required data
  const slipFile = document.getElementById("slip").files[0];
  if (!slipFile) {
    showError('Please upload a payment slip image');
    // Reset button state
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.classList.remove("btn-loading");
    submitBtn.disabled = false;
    submitBtn.querySelector("span").textContent = "Submit Order";
    return;
  }
  
  if (!turnstileToken) {
    showError('Please complete the bot verification');
    // Reset button state
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.classList.remove("btn-loading");
    submitBtn.disabled = false;
    submitBtn.querySelector("span").textContent = "Submit Order";
    return;
  }
    
    // Convert image to base64
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64Image = e.target.result.split(',')[1]; // Remove data URL prefix
      
      const formData = new URLSearchParams();
      formData.append("email", document.getElementById("email").value.trim());
      formData.append("phone", document.getElementById("phone").value.trim());
      formData.append("item", localStorage.getItem("item"));
      formData.append("price", localStorage.getItem("price"));
      formData.append("quantity", document.getElementById("qty").value);
      formData.append("size", localStorage.getItem("selectedSize") || 'M');
      formData.append("base64Image", base64Image);
      formData.append("turnstileToken", turnstileToken);
      
      console.log('Sending to backend:', formData.toString());
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      fetch(API_URL, {
        method: "POST",
        body: formData,
        signal: controller.signal
      })
      .then(res => {
        clearTimeout(timeoutId);
        console.log('Backend response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Backend response:', data);
        
        // Reset button state
        const submitBtn = document.getElementById("submitBtn");
        submitBtn.classList.remove("btn-loading");
        submitBtn.disabled = false;
        submitBtn.querySelector("span").textContent = "Submit Order";

        if (!data.success) {
          throw new Error(data.message || 'Order submission failed');
        }

        const orderId = data.data?.orderId || Date.now();
        const email = document.getElementById("email").value.trim();
      const item = localStorage.getItem("item");
      const qty = document.getElementById("qty").value;
      const total = parseFloat(localStorage.getItem("price")) * qty;

      // Save receipt data
      localStorage.setItem('receipt-email', email);
      localStorage.setItem('receipt-item', item);
      localStorage.setItem('receipt-qty', qty);
      localStorage.setItem('receipt-total', '฿' + total);

      // Save order ID to localStorage for success page
      localStorage.setItem('lastOrderId', orderId);

      // Redirect to success page with order ID
      window.location.href = "success.html?id=" + orderId;
      })
      .catch(err => {
        clearTimeout(timeoutId);
        console.error('Submission error:', err);
        
        // Reset button state on error
        const submitBtn = document.getElementById("submitBtn");
        submitBtn.classList.remove("btn-loading");
        submitBtn.disabled = false;
        submitBtn.querySelector("span").textContent = "Submit Order";
        
        if (err.name === 'AbortError') {
          showError('Request timed out. Please try again.');
        } else {
          showError(err.message || "Submission failed");
        }
      });
    };
    
    reader.readAsDataURL(slipFile);
    
    // Add error handling for file reading
    reader.onerror = function() {
      clearTimeout(timeoutId);
      const submitBtn = document.getElementById("submitBtn");
      submitBtn.classList.remove("btn-loading");
      submitBtn.disabled = false;
      submitBtn.querySelector("span").textContent = "Submit Order";
      showError('Failed to read payment slip image');
    };
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
