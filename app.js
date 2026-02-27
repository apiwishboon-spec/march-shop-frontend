/*************************************************
 * ART&INK SHOP – AUTO QR VERSION (2-STEP PROCESS)
 *************************************************/

let turnstileToken = null;
let generatedPayload = null;
let qrTimer = null;
let qrExpiryTime = null;
let selectedPaymentMethod = 'promptpay';

const API_URL = "https://script.google.com/macros/s/AKfycbxENBG6cKm3ImJd_6gjvxCUnM-hG0xeNhPhjLUleDCyh0JsXhkkG7wOwkBjRW43j-88mg/exec";

document.addEventListener("DOMContentLoaded", function () {
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
  // Only PromptPay now - no payment method switching needed
  showPromptPaySection();
}

function showPromptPaySection() {
  document.getElementById('promptpay-section').style.display = 'block';

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
  // qrTotal element was removed, so we skip this update
  console.log('QR generated for total:', total);
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
  formData.append("action", "order"); // Add missing action parameter
  formData.append("email", "preview@shop.com"); // dummy
  formData.append("phone", "093-337-2907"); // Your actual phone number for payments
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

      console.log('QR generated successfully, total:', data.data.total);
    })
    .catch(err => {
      console.error('QR generation failed:', err);
      alert('QR generation failed: ' + err.message);
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
  // Show blur overlay with loader
  const blurOverlay = document.getElementById("blurOverlay");
  if (blurOverlay) {
    blurOverlay.classList.add("active");
  }
  
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
  const btnText = submitBtn.querySelector(".btn-text") || submitBtn;

  // Show loading state
  submitBtn.classList.add("btn-loading");
  submitBtn.disabled = true;
  if (btnText) btnText.textContent = ""; // Hide button text

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
    submitBtn.querySelector(".btn-text").textContent = "Submit Order";

    // Hide full-page loader overlay
    const pageLoader = document.getElementById("pageLoader");
    if (pageLoader) {
      pageLoader.classList.remove("active");
      document.body.classList.remove("page-loading"); // Restore scrolling
    }
    return;
  }

  if (!turnstileToken) {
    showError('Please complete the bot verification');
    // Reset button state
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.classList.remove("btn-loading");
    submitBtn.disabled = false;
    submitBtn.querySelector(".btn-text").textContent = "Submit Order";

    // Hide full-page loader overlay
    const pageLoader = document.getElementById("pageLoader");
    if (pageLoader) {
      pageLoader.classList.remove("active");
      document.body.classList.remove("page-loading"); // Restore scrolling
    }
    return;
  }

  // Convert image to base64
  const reader = new FileReader();
  reader.onload = function (e) {
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
        submitBtn.querySelector(".btn-text").textContent = "Submit Order";

        // Hide full-page loader overlay
        const pageLoader = document.getElementById("pageLoader");
        if (pageLoader) {
          pageLoader.classList.remove("active");
          document.body.classList.remove("page-loading"); // Restore scrolling
        }

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

        // Hide blur overlay before redirect
        const blurOverlay = document.getElementById("blurOverlay");
        if (blurOverlay) {
          blurOverlay.classList.remove("active");
        }

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
        submitBtn.querySelector(".btn-text").textContent = "Submit Order";

        // Hide full-page loader overlay
        const pageLoader = document.getElementById("pageLoader");
        if (pageLoader) {
          pageLoader.classList.remove("active");
          document.body.classList.remove("page-loading"); // Restore scrolling
        }

        if (err.name === 'AbortError') {
          showError('Request timed out. Please try again.');
        } else {
          showError(err.message || "Submission failed");
        }
      });
  };

  reader.readAsDataURL(slipFile);
}

// ================================
function showSuccess(message) {
  let successElement = document.getElementById("success-msg");
  if (!successElement) {
    successElement = document.createElement("div");
    successElement.id = "success-msg";
    successElement.style.cssText = "background:#d4edda;color:#155724;padding:12px;border-radius:8px;margin-bottom:20px;display:none;";
    const container = document.querySelector(".container") || document.body;
    container.insertBefore(successElement, container.firstChild);
  }
  successElement.textContent = message;
  successElement.style.display = "block";
  setTimeout(() => {
    successElement.style.display = "none";
  }, 5000);
}

// ================================
function showError(message) {
  // Hide blur overlay when showing error
  const blurOverlay = document.getElementById("blurOverlay");
  if (blurOverlay) {
    blurOverlay.classList.remove("active");
  }
  
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

// Gallery Functions
function changeGalleryImage(thumbnail, index) {
  const mainImage = thumbnail.closest('.product-gallery').querySelector('.gallery-main');
  const allThumbnails = thumbnail.closest('.gallery-thumbnails').querySelectorAll('.thumbnail');

  // Remove active class from all thumbnails
  allThumbnails.forEach(thumb => thumb.classList.remove('active'));

  // Add active class to clicked thumbnail
  thumbnail.classList.add('active');

  // Change main image
  mainImage.src = thumbnail.src;
}

// Newsletter Functions
function subscribeNewsletter(event) {
  if (event) event.preventDefault();

  // Support both explicit #nl-email id (index.html) and .newsletter-input class (fallback)
  const emailInput = document.getElementById('nl-email')
    || (event && event.target.querySelector('.newsletter-input'));
  const email = emailInput ? emailInput.value.trim() : '';

  if (!email) return;

  const formData = new URLSearchParams();
  formData.append('email', email);
  formData.append('action', 'newsletter');

  fetch(API_URL, {
    method: 'POST',
    body: formData
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        showSuccess('🎉 Subscribed! Welcome to the ART&INK community.');
        if (emailInput) emailInput.value = '';
        if (event && event.target && event.target.reset) event.target.reset();
      } else {
        showError('Failed to subscribe: ' + (data.message || 'Please try again.'));
      }
    })
    .catch(() => {
      showError('Connection error. Please try again.');
    });
}

// Admin – just navigate to the admin page which has its own secure login wall
function showAdminLogin() {
  window.location.href = 'admin.html';
}

// ── Product Popup Functions ──
let currentProduct = null;
let currentImageIndex = 0;
let selectedSize = 'M';

function showProductPopup(name, price, image, description, sizes) {
  currentProduct = { name, price, images: [image], description, sizes };
  currentImageIndex = 0;
  selectedSize = sizes.includes('M') ? 'M' : sizes[0];

  document.getElementById('popup-title').textContent = name;
  document.getElementById('popup-price').textContent = price;
  document.getElementById('popup-description').textContent = description;
  document.getElementById('popup-main-image').src = image;
  document.getElementById('image-counter').textContent = '1 / 1';

  // Thumbnails
  const thumbsEl = document.getElementById('popup-thumbs');
  thumbsEl.innerHTML = `<img class="popup-thumb active" src="${image}" alt="${name}" onclick="selectImage(0)" />`;

  // Sizes
  const sizesEl = document.getElementById('popup-sizes');
  sizesEl.innerHTML = sizes.map(s =>
    `<button class="size-btn ${s === selectedSize ? 'selected' : ''}" onclick="selectSize('${s}')" data-size="${s}">${s}</button>`
  ).join('');

  document.getElementById('product-popup').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeProductPopup() {
  document.getElementById('product-popup').classList.add('hidden');
  document.body.style.overflow = '';
}

function selectImage(index) {
  if (!currentProduct || !currentProduct.images[index]) return;
  currentImageIndex = index;
  document.getElementById('popup-main-image').src = currentProduct.images[index];
  document.getElementById('image-counter').textContent = `${index + 1} / ${currentProduct.images.length}`;
  document.querySelectorAll('.popup-thumb').forEach((t, i) => t.classList.toggle('active', i === index));
}

function previousImage() { 
  if (currentImageIndex > 0) selectImage(currentImageIndex - 1); 
}

function nextImage() { 
  if (currentProduct && currentImageIndex < currentProduct.images.length - 1) selectImage(currentImageIndex + 1); 
}

function selectSize(size) {
  selectedSize = size;
  document.querySelectorAll('.size-btn').forEach(b => b.classList.toggle('selected', b.dataset.size === size));
}

function orderFromPopup() {
  if (!currentProduct) return;
  localStorage.setItem('item', currentProduct.name);
  localStorage.setItem('price', currentProduct.price);
  localStorage.setItem('selectedSize', selectedSize);
  closeProductPopup();
  window.location.href = 'order.html';
}

function goOrder(itemName, itemPrice) {
  localStorage.setItem('item', itemName);
  localStorage.setItem('price', itemPrice);
  window.location.href = 'order.html';
}

function openPrivacy() { 
  document.getElementById('privacy-overlay').classList.remove('hidden'); 
}

function closePrivacy() { 
  document.getElementById('privacy-overlay').classList.add('hidden'); 
}
