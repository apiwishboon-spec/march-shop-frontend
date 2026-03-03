/*************************************************
 * ART&INK SHOP – AUTO QR VERSION (2-STEP PROCESS)
 *************************************************/

let turnstileToken = null;
let generatedPayload = null;
let qrTimer = null;
let qrExpiryTime = null;
let selectedPaymentMethod = 'promptpay';
let currentGoogleToken = null;
let currentAuthMethod = 'auto'; // 'auto' or 'manual'

// Helper function to decode JWT
function decodeJwtResponse(token) {
  let base64Url = token.split('.')[1];
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  let jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

// Global hook for Google GIS callback
window.handleCredentialResponse = function (response) {
  currentGoogleToken = response.credential;
  const payload = decodeJwtResponse(currentGoogleToken);

  // Update UI to show they are logged in
  document.getElementById('google-login-button').style.display = 'none';
  const profileDiv = document.getElementById('google-profile-display');

  if (profileDiv) {
    profileDiv.style.display = 'flex';
    document.getElementById('google-profile-pic').src = payload.picture;
    document.getElementById('google-profile-name').textContent = payload.name + ' (' + payload.email + ')';
    document.getElementById('email-auto').value = payload.email; // Save to hidden auto input
  }

  showSuccess(`Signed in as ${payload.given_name}`);
};

// UI toggle switch logic
window.toggleAuthMethod = function (method) {
  currentAuthMethod = method;

  const autoBtn = document.getElementById('auth-auto-btn');
  const manualBtn = document.getElementById('auth-manual-btn');

  if (method === 'auto') {
    autoBtn.classList.add('active');
    autoBtn.style.opacity = '1';

    manualBtn.classList.remove('active');
    manualBtn.style.opacity = '0.7';

    document.getElementById('google-auth-section').style.display = 'block';
    document.getElementById('manual-auth-section').style.display = 'none';
  } else {
    autoBtn.classList.remove('active');
    autoBtn.style.opacity = '0.7';

    manualBtn.classList.add('active');
    manualBtn.style.opacity = '1';

    document.getElementById('google-auth-section').style.display = 'none';
    document.getElementById('manual-auth-section').style.display = 'block';
  }
}

// Reset Google auth
window.resetGoogleAuth = function () {
  currentGoogleToken = null;
  document.getElementById('google-profile-display').style.display = 'none';
  document.getElementById('google-login-button').style.display = 'flex';
  document.getElementById('email-auto').value = '';
}

const API_URL = "https://script.google.com/macros/s/AKfycbxENBG6cKm3ImJd_6gjvxCUnM-hG0xeNhPhjLUleDCyh0JsXhkkG7wOwkBjRW43j-88mg/exec";

document.addEventListener("DOMContentLoaded", function () {
  // Check if we are on a page that has the Google Login button
  const container = document.getElementById("google-login-button");
  if (container) {
    function initGoogleAuth() {
      if (window.google && window.google.accounts) {
        container.innerHTML = ""; // Clear out the fallback button
        google.accounts.id.initialize({
          client_id: "292346174128-fk8na6afbrb07q2v1oqc193j83idtjuh.apps.googleusercontent.com",
          callback: handleCredentialResponse
        });
        google.accounts.id.renderButton(
          container,
          { theme: "outline", size: "large", shape: "pill", width: 280 }
        );
      } else {
        setTimeout(initGoogleAuth, 100);
      }
    }
    initGoogleAuth();
  }

  const item = localStorage.getItem("item");
  const price = parseFloat(localStorage.getItem("price"));
  const selectedSize = localStorage.getItem("selectedSize") || 'M';

  // Make sure this logic ONLY fires on the order page!
  if (window.location.pathname.includes('order')) {
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
  }
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
  // Determine which email we are using based on auth method
  let emailValue = '';

  if (currentAuthMethod === 'auto') {
    if (!currentGoogleToken) {
      showError("Please sign in with Google to continue, or switch to Manual Entry.");
      return;
    }
    emailValue = document.getElementById("email-auto").value.trim();
  } else {
    emailValue = document.getElementById("email-manual").value.trim();
  }

  const phone = document.getElementById("phone").value.trim();
  const qty = document.getElementById("qty").value;

  if (!emailValue || !emailValue.includes("@")) {
    showError("Please enter a valid email address.");
    return;
  }

  // Remove any spaces or dashes they typed to check the raw digits
  const cleanPhone = phone.replace(/[\s\-]/g, '');

  if (!cleanPhone || cleanPhone.length < 10) {
    showError("Please enter a valid 10-digit phone number.");
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
  generateQR(emailValue);
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
function generateQR(userEmail) {
  const qty = Number(document.getElementById("qty").value);
  const price = parseFloat(localStorage.getItem("price"));
  const itemName = localStorage.getItem("item");

  console.log("=== QR GENERATION DEBUG ===");
  console.log("Item name from localStorage:", itemName);
  console.log("Price from localStorage:", price);
  console.log("Quantity from input:", qty);

  if (!qty || qty < 1) return;

  // Use the actual product name directly as itemId
  const itemId = itemName;
  console.log("Using itemId:", itemId);

  const formData = new URLSearchParams();
  formData.append("action", "order");
  formData.append("email", userEmail || "preview@shop.com"); // Use provided email
  formData.append("phone", document.getElementById("phone").value.trim());
  formData.append("itemId", itemId);
  formData.append("price", price);
  formData.append("quantity", qty);

  console.log("Sending form data:");
  console.log("Action: order");
  console.log("Email: preview@shop.com");
  console.log("Phone: 093-337-2907");
  console.log("ItemId:", itemId);
  console.log("Price:", price);
  console.log("Quantity:", qty);

  fetch(API_URL, {
    method: "POST",
    body: formData
  })
    .then(res => {
      console.log("Response status:", res.status);
      console.log("Response headers:", res.headers);
      return res.json();
    })
    .then(data => {
      console.log("Backend response:", data);

      if (!data.success) {
        throw new Error(data.message);
      }

      generatedPayload = data.data.promptPayPayload;

      const qrImg = document.getElementById("dynamicQR");
      // Add cache busting timestamp and higher error correction for security
      const qrUrlWithCache = data.data.qrImage + "&v=" + Date.now() + "&ecc=H";
      console.log("QR URL with cache:", qrUrlWithCache);
      qrImg.src = qrUrlWithCache;

      // Start 5-minute timer
      startQRTimer();

      console.log('QR generated successfully, total:', data.data.total);
    })
    .catch(err => {
      console.error('QR generation failed:', err);
      console.error('Error details:', err.message);
      console.error('Error stack:', err.stack);
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

// Helper to hide all loading overlays
function hideLoaders() {
  const loaders = ['blurOverlay', 'pageLoader'];
  loaders.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("active");
  });

  document.body.classList.remove("page-loading");

  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.classList.remove("btn-loading");
    submitBtn.disabled = false;
    const btnText = submitBtn.querySelector(".btn-text") || submitBtn;
    if (btnText && btnText.tagName !== 'BUTTON') {
      btnText.textContent = "Submit Order";
    } else if (submitBtn.tagName === 'BUTTON' && !submitBtn.querySelector(".btn-text")) {
      submitBtn.textContent = "Submit Order";
    }
  }
}

// ================================
// SUBMIT ORDER (WITH LOADING)
// ================================
function submitOrder() {
  try {
    // Show blur overlay with loader
    const blurOverlay = document.getElementById("blurOverlay");
    if (blurOverlay) {
      blurOverlay.classList.add("active");
    }

    // Determine which email we are using based on auth method
    let emailValue = '';
    if (currentAuthMethod === 'auto') {
      emailValue = document.getElementById("email-auto").value.trim();
    } else {
      emailValue = document.getElementById("email-manual").value.trim();
    }

    const phone = document.getElementById("phone").value.trim();
    const item = localStorage.getItem("item");
    const price = parseFloat(localStorage.getItem("price"));
    const qty = Number(document.getElementById("qty").value);
    const size = localStorage.getItem("selectedSize") || 'M';

    if (!item || price <= 0 || qty < 1) {
      showError("Invalid order data");
      hideLoaders();
      return;
    }

    if (!emailValue) {
      showError("Email is required");
      hideLoaders();
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

    const slipFile = document.getElementById("slip").files[0];
    if (!slipFile) {
      showError('Please upload a payment slip image');
      hideLoaders();
      return;
    }

    if (!turnstileToken) {
      showError('Please complete the bot verification');
      hideLoaders();
      return;
    }

    // Convert image to base64
    const reader = new FileReader();
    reader.onload = function (e) {
      const base64Image = e.target.result.split(',')[1]; // Remove data URL prefix

      const formData = new URLSearchParams();
      formData.append("action", "order"); // Add action parameter
      formData.append("email", emailValue); // Use the validated email value
      const cleanPhone = phone.replace(/[\s\-]/g, '');
      formData.append("phone", cleanPhone);
      formData.append("itemId", item);
      formData.append("price", price);
      formData.append("quantity", qty);
      formData.append("size", size);
      formData.append("base64Image", base64Image);
      formData.append("turnstileToken", turnstileToken);

      // IMPORTANT!!! Send the Google Authentication Token securely to the backend if used
      if (currentAuthMethod === 'auto' && currentGoogleToken) {
        formData.append("googleToken", currentGoogleToken);
      }

      // Add technical data for security purposes
      formData.append("useragent", navigator.userAgent);
      formData.append("timestamp", new Date().toISOString());

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

          hideLoaders();

          if (!data.success) {
            throw new Error(data.message || 'Order submission failed');
          }

          const orderId = data.data?.orderId || Date.now();
          const total = price * qty;

          // Save receipt data
          localStorage.setItem('receipt-email', emailValue);
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
  } catch (err) {
    console.error("Order submit crash:", err);
    showError("An unexpected error occurred: " + err.message);
    hideLoaders();
  }
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

// Admin – just navigate to the admin page which has its own secure login wall
function showAdminLogin() {
  window.location.href = 'admin.html';
}

function openPrivacy() {
  document.getElementById('privacy-overlay').classList.remove('hidden');
}

function closePrivacy() {
  document.getElementById('privacy-overlay').classList.add('hidden');
}

// =====================
// INDEX PAGE JAVASCRIPT
// =====================

// Development Notice Modal
function closeDevNotice() {
  const modal = document.getElementById('devNoticeModal');
  modal.style.display = 'none';
  // No cookie - show notice every time
}

// Check if user has already seen the notice
function checkDevNotice() {
  // Always show the notice - no remembering
  // Modal will be visible every page load
}

// Essential functions (inline to avoid app.js conflicts)
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

  const thumbsEl = document.getElementById('popup-thumbs');
  thumbsEl.innerHTML = `<img class="popup-thumb active" src="${image}" alt="${name}" onclick="selectImage(0)" />`;

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

  console.log("=== ORDER FROM POPUP DEBUG ===");
  console.log("Current product:", currentProduct);
  console.log("Selected size:", selectedSize);

  localStorage.setItem('item', currentProduct.name);
  localStorage.setItem('price', currentProduct.price);
  localStorage.setItem('selectedSize', selectedSize);

  console.log("Set localStorage - item:", currentProduct.name);
  console.log("Set localStorage - price:", currentProduct.price);
  console.log("Set localStorage - size:", selectedSize);

  closeProductPopup();
  window.location.href = 'order.html';
}

function goOrder(itemName, itemPrice) {
  console.log("=== GO ORDER DEBUG ===");
  console.log("Item name:", itemName);
  console.log("Item price:", itemPrice);

  localStorage.setItem('item', itemName);
  localStorage.setItem('price', itemPrice);

  console.log("Set localStorage - item:", itemName);
  console.log("Set localStorage - price:", itemPrice);

  window.location.href = 'order.html';
}

// =====================
// ANIMATED NAVIGATION
// =====================

// Initialize animated navigation when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  // Check if we're on index page for newsletter setup
  if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    // Check development notice first
    checkDevNotice();

    // Then setup newsletter form
    const form = document.getElementById('nl-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        e.stopPropagation();

        const email = document.getElementById('nl-email').value.trim();
        const btn = document.getElementById('nl-btn');
        const status = document.getElementById('nl-status');

        if (!email) return;

        btn.disabled = true;
        btn.textContent = '⏳ Subscribing…';
        status.textContent = '';
        status.className = 'nl-status';

        const fd = new URLSearchParams();
        fd.append('email', email);
        fd.append('action', 'newsletter');

        // Add technical data for security purposes
        fd.append('useragent', navigator.userAgent);
        fd.append('timestamp', new Date().toISOString());

        fetch('https://script.google.com/macros/s/AKfycbxENBG6cKm3ImJd_6gjvxCUnM-hG0xeNhPhjLUleDCyh0JsXhkkG7wOwkBjRW43j-88mg/exec', {
          method: 'POST',
          body: fd
        })
          .then(r => r.json())
          .then(data => {
            btn.disabled = false;
            btn.textContent = 'Subscribe';
            if (data.success) {
              status.textContent = '✓ You\'re subscribed! Check your inbox.';
              status.className = 'nl-status ok';
              document.getElementById('nl-email').value = '';
            } else {
              status.textContent = '✗ ' + (data.message || 'Please try again.');
              status.className = 'nl-status fail';
            }
          })
          .catch(() => {
            btn.disabled = false;
            btn.textContent = 'Subscribe';
            status.textContent = '⚠ Connection error. Please try again.';
            status.className = 'nl-status fail';
          });
      });
    }
  }

  // Check if we're on FAQ page for FAQ functionality
  if (window.location.pathname.includes('faq.html')) {
    // Initialize FAQ accordion
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
      question.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        const answer = this.nextElementSibling;
        const isActive = this.classList.contains('active');

        // Close all other FAQs in the same section
        const section = this.closest('.faq-section');
        section.querySelectorAll('.faq-question.active').forEach(otherQuestion => {
          if (otherQuestion !== this) {
            otherQuestion.classList.remove('active');
            otherQuestion.nextElementSibling.classList.remove('active');
          }
        });

        // Toggle current FAQ
        this.classList.toggle('active');
        answer.classList.toggle('active');
      });
    });

    // Category filtering
    const categoryBtns = document.querySelectorAll('.faq-category-btn');
    const faqSections = document.querySelectorAll('.faq-section');
    const noResults = document.getElementById('noResults');
    const faqSectionsContainer = document.querySelector('.faq-sections');

    categoryBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        const category = this.dataset.category;

        // Update active button
        categoryBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        // Filter sections
        let visibleSections = 0;
        faqSections.forEach(section => {
          if (category === 'all' || section.dataset.category === category) {
            section.style.display = 'block';
            visibleSections++;
          } else {
            section.style.display = 'none';
          }
        });

        // Show/hide no results message
        if (visibleSections === 0) {
          noResults.style.display = 'block';
          faqSectionsContainer.style.display = 'none';
        } else {
          noResults.style.display = 'none';
          faqSectionsContainer.style.display = 'block';
        }
      });
    });

    // Search functionality
    const searchInput = document.getElementById('faqSearch');
    const faqItems = document.querySelectorAll('.faq-item');

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();
        let visibleItems = 0;

        // Show all sections and reset category filter
        faqSections.forEach(section => {
          section.style.display = 'block';
        });
        if (faqSectionsContainer) faqSectionsContainer.style.display = 'block';
        if (noResults) noResults.style.display = 'none';

        // Reset category buttons
        categoryBtns.forEach(btn => {
          btn.classList.remove('active');
          if (btn.dataset.category === 'all') {
            btn.classList.add('active');
          }
        });

        // Filter FAQ items
        faqItems.forEach(item => {
          const question = item.querySelector('.faq-question').textContent.toLowerCase();
          const answer = item.querySelector('.faq-answer').textContent.toLowerCase();

          if (question.includes(searchTerm) || answer.includes(searchTerm)) {
            item.style.display = 'block';
            visibleItems++;

            // Show parent section
            const section = item.closest('.faq-section');
            section.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        });

        // Show no results if nothing matches
        if (visibleItems === 0 && searchTerm !== '' && noResults && faqSectionsContainer) {
          noResults.style.display = 'block';
          faqSectionsContainer.style.display = 'none';
        }
      });
    }

    // Add smooth scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  // Check if we're on order page for order functionality
  if (window.location.pathname.includes('order.html')) {
    // Dark mode functionality with local time adaptation
    function toggleTheme() {
      const html = document.documentElement;
      const sunIcon = document.querySelector('.sun-icon');
      const moonIcon = document.querySelector('.moon-icon');

      if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
        localStorage.setItem('theme', 'light');
      } else {
        html.classList.add('dark');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
        localStorage.setItem('theme', 'dark');
      }
    }

    // Check for saved theme preference and local time
    function initTheme() {
      const hour = new Date().getHours();
      const isNightTime = hour >= 18 || hour < 6; // 6 PM to 6 AM
      const savedTheme = localStorage.getItem('theme');

      // Auto-enable dark mode during night hours if no preference saved
      if (savedTheme === 'dark' || (!savedTheme && isNightTime)) {
        document.documentElement.classList.add('dark');
        const sunIcon = document.querySelector('.sun-icon');
        const moonIcon = document.querySelector('.moon-icon');
        if (sunIcon) sunIcon.style.display = 'none';
        if (moonIcon) moonIcon.style.display = 'block';
      }
    }

    // Initialize theme on page load
    initTheme();

    // Phone number formatting
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        let formattedValue = '';

        if (value.length > 0) {
          formattedValue = value.substring(0, 3);
        }
        if (value.length > 3) {
          formattedValue += '-' + value.substring(3, 6);
        }
        if (value.length > 6) {
          formattedValue += '-' + value.substring(6, 10);
        }

        e.target.value = formattedValue;
      });
    }

    // Size Selection
    function selectOrderSize(size) {
      selectedSize = size;

      // Update button states
      document.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.size === size);
      });

      // Update summary display
      const summarySize = document.getElementById('summary-size');
      if (summarySize) {
        summarySize.textContent = size;
      }

      // Save to localStorage
      localStorage.setItem('selectedSize', size);
    }

    // Initialize order page
    console.log("=== ORDER PAGE DEBUG ===");

    const savedSize = localStorage.getItem('selectedSize') || 'M';
    const itemName = localStorage.getItem('item');
    const itemPrice = localStorage.getItem('price');

    console.log("Loaded from localStorage:");
    console.log("- Item:", itemName);
    console.log("- Price:", itemPrice);
    console.log("- Size:", savedSize);

    // Update order summary
    const summaryProduct = document.getElementById('summary-product');
    const summaryPrice = document.getElementById('summary-price');

    if (itemName && summaryProduct) {
      summaryProduct.textContent = itemName;
      console.log("Updated product display:", itemName);
    }

    if (itemPrice && summaryPrice) {
      summaryPrice.textContent = itemPrice;
      console.log("Updated price display:", itemPrice);
    }

    selectOrderSize(savedSize);

    console.log("Order page initialization complete");

    // Collapsible instructions
    window.toggleInstructions = function () {
      const toggle = document.getElementById('instructionsToggle');
      const instructions = document.querySelector('.payment-instructions');

      if (instructions) {
        if (instructions.style.display === 'none' || instructions.style.display === '') {
          instructions.style.display = 'block';
          if (toggle) {
            const chevron = toggle.querySelector('.chevron-icon');
            if (chevron) chevron.textContent = '▲';
          }
        } else {
          instructions.style.display = 'none';
          if (toggle) {
            const chevron = toggle.querySelector('.chevron-icon');
            if (chevron) chevron.textContent = '▼';
          }
        }
      }
    };
  }

  // Check if we're on success page for success functionality
  if (window.location.pathname.includes('success.html')) {
    // Show order ID
    const urlParams = new URLSearchParams(window.location.search);
    let orderId = urlParams.get('id') || localStorage.getItem('lastOrderId') || 'ART-' + Date.now();
    localStorage.setItem('lastOrderId', orderId);
    const codeElement = document.getElementById('code');
    if (codeElement) {
      codeElement.textContent = orderId;
    }

    // Confetti animation
    const canvas = document.getElementById('confetti');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const colors = ['#f3a6c8', '#d9b7ee', '#9ecbff', '#fde68a', '#a7f3d0'];
      const pieces = [];

      for (let i = 0; i < 140; i++) {
        pieces.push({
          x: Math.random() * canvas.width,
          y: Math.random() * -canvas.height - 20,
          r: Math.random() * 7 + 3,
          dY: Math.random() * 2.5 + 1.5,
          dX: (Math.random() - 0.5) * 2.5,
          rot: Math.random() * 360,
          dRot: (Math.random() - 0.5) * 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: Math.random() > .5 ? 'circle' : 'rect'
        });
      }

      function drawConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach((p, i) => {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot * Math.PI / 180);
          ctx.fillStyle = p.color;
          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.r, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.r, -p.r * .5, p.r * 2, p.r);
          }
          ctx.restore();
          p.y += p.dY;
          p.x += p.dX;
          p.rot += p.dRot;
          if (p.y > canvas.height + 20) pieces.splice(i, 1);
        });
        if (pieces.length > 0) requestAnimationFrame(drawConfetti);
      }

      drawConfetti();
      window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      });
    }
  }

  // Check if we're on 404 page for 404 functionality
  if (window.location.pathname.includes('404.html')) {
    // Enhanced interactive elements
    // Create enhanced floating paint drops
    const container = document.querySelector('.error-container');
    if (container) {
      const paintEmojis = ['🎨', '🖌️', '✨', '🌟', '💫', '🎭', '🖼️', '🎪'];

      for (let i = 0; i < 8; i++) {
        const paintDrop = document.createElement('div');
        paintDrop.innerHTML = paintEmojis[i];
        paintDrop.style.cssText = `
          position: absolute;
          font-size: ${Math.random() * 25 + 15}px;
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          opacity: 0.4;
          animation: float ${Math.random() * 4 + 5}s ease-in-out infinite;
          animation-delay: ${Math.random() * 3}s;
          z-index: 1;
          filter: drop-shadow(0 5px 10px rgba(248, 165, 194, 0.2));
        `;
        container.appendChild(paintDrop);
      }

      // Enhanced click effect for buttons
      const buttons = document.querySelectorAll('.btn-home, .btn-secondary');
      buttons.forEach(button => {
        button.addEventListener('click', function (e) {
          // Create multiple ripples
          for (let i = 0; i < 3; i++) {
            setTimeout(() => {
              const ripple = document.createElement('span');
              ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                transform: scale(0);
                animation: ripple 0.8s ease-out;
                pointer-events: none;
              `;

              const rect = this.getBoundingClientRect();
              const size = Math.max(rect.width, rect.height);
              ripple.style.width = ripple.style.height = size + 'px';
              ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
              ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';

              this.style.position = 'relative';
              this.style.overflow = 'hidden';
              this.appendChild(ripple);

              setTimeout(() => ripple.remove(), 800);
            }, i * 100);
          }
        });

        // Add hover sound effect (visual feedback)
        button.addEventListener('mouseenter', function () {
          this.style.transform = 'translateY(-3px) scale(1.05)';
        });

        button.addEventListener('mouseleave', function () {
          this.style.transform = 'translateY(0) scale(1)';
        });
      });

      // Add parallax effect on mouse move
      container.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;

        const decorations = document.querySelectorAll('.bg-decoration');
        decorations.forEach((decoration, index) => {
          const speed = (index + 1) * 0.5;
          decoration.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
        });
      });

      // Add keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          const homeBtn = document.querySelector('.btn-home');
          if (document.activeElement === document.body) {
            homeBtn.click();
          }
        }
      });
    }

    // Enhanced ripple animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Check if we're on admin page for admin functionality
  if (window.location.pathname.includes('admin.html')) {
    const API_URL = "https://script.google.com/macros/s/AKfycbxENBG6cKm3ImJd_6gjvxCUnM-hG0xeNhPhjLUleDCyh0JsXhkkG7wOwkBjRW43j-88mg/exec";

    let barChart = null;
    let donutChart = null;

    // AUTH CHECK
    if (sessionStorage.getItem('adminAuth') === 'true') {
      showAdminDashboard();
    } else {
      setTimeout(() => document.getElementById('pw-input').focus(), 100);
      document.getElementById('pw-input').addEventListener('keypress', e => {
        if (e.key === 'Enter') attemptAdminLogin();
      });
    }

    // LOGIN
    function attemptAdminLogin() {
      console.log("=== ADMIN LOGIN DEBUG ===");

      const pw = document.getElementById('pw-input').value.trim();
      const btn = document.getElementById('btn-go');
      const errEl = document.getElementById('login-error');

      console.log("Password entered:", pw ? "***" : "(empty)");
      console.log("Button element:", btn);
      console.log("Error element:", errEl);

      if (!pw) {
        errEl.textContent = 'Please enter password';
        console.log("Error: Empty password");
        return;
      }
      btn.disabled = true;
      btn.textContent = '⏳ Checking…';
      errEl.textContent = '';

      const fd = new URLSearchParams();
      fd.append('password', pw);
      fd.append('action', 'adminLogin');

      // Add technical data for security purposes
      fd.append('useragent', navigator.userAgent);
      fd.append('timestamp', new Date().toISOString());

      fetch(API_URL, { method: 'POST', body: fd })
        .then(r => r.json())
        .then(data => {
          console.log('Login response:', data); // Debug log
          if (data.success) {
            sessionStorage.setItem('adminAuth', 'true');
            sessionStorage.setItem('adminToken', data.data.token);
            console.log('Stored token:', data.data.token); // Debug log
            console.log('SessionStorage token:', sessionStorage.getItem('adminToken')); // Debug log
            showAdminDashboard();
          } else {
            errEl.textContent = '❌ Wrong password. Please try again.';
            btn.disabled = false;
            btn.textContent = 'Go →';
            document.getElementById('pw-input').value = '';
            document.getElementById('pw-input').focus();
          }
        })
        .catch(() => {
          errEl.textContent = '⚠️ Cannot reach server. Check your connection.';
          btn.disabled = false;
          btn.textContent = 'Go →';
        });
    }

    function cancelLogin() { window.location.href = 'index.html'; }

    // DASHBOARD
    function showAdminDashboard() {
      document.getElementById('login-wall').classList.add('hidden');
      document.getElementById('dashboard').classList.add('visible');
      loadAdminData();
    }

    function logout() {
      sessionStorage.removeItem('adminAuth');
      sessionStorage.removeItem('adminToken');
      window.location.reload();
    }

    function refreshData() {
      ['total-orders', 'total-revenue', 'products-sold', 'new-customers', 'subscriber-count'].forEach(id => {
        const el = document.getElementById(id);
        el.textContent = '—';
        el.classList.add('skeleton');
      });
      document.getElementById('last-updated').textContent = 'Refreshing…';
      loadAdminData();
    }

    // LOAD ANALYTICS
    function loadAdminData() {
      const token = sessionStorage.getItem('adminToken');
      if (!token) {
        showToast('Session expired. Please login again.', 'fail');
        logout();
        return;
      }

      const fd = new URLSearchParams();
      fd.append('action', 'adminData');
      fd.append('token', token);

      fetch(API_URL, { method: 'POST', body: fd })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            updateAdminStats(res.data);
            buildAdminCharts(res.data);
          } else {
            if (res.message === 'Unauthorized') {
              showToast('Session expired. Please login again.', 'fail');
              logout();
            } else {
              showToast('Could not load analytics.', 'fail');
              clearSkeletons();
            }
          }
        })
        .catch(() => {
          showToast('Network error — could not reach server.', 'fail');
          clearSkeletons();
        });
    }

    function updateAdminStats(d) {
      const now = new Date().toLocaleString('th-TH', { hour12: false });
      document.getElementById('last-updated').textContent = 'Last updated: ' + now;
      setAdminVal('total-orders', d.orders.toLocaleString());
      setAdminVal('total-revenue', '฿' + d.revenue.toLocaleString());
      setAdminVal('products-sold', d.productsSold.toLocaleString());
      setAdminVal('new-customers', d.newCustomers.toLocaleString());
      setAdminVal('subscriber-count', d.subscribers.toLocaleString());
    }

    function setAdminVal(id, val) {
      const el = document.getElementById(id);
      el.classList.remove('skeleton');
      el.textContent = val;
    }

    function clearSkeletons() {
      ['total-orders', 'total-revenue', 'products-sold', 'new-customers', 'subscriber-count']
        .forEach(id => setAdminVal(id, '—'));
    }

    // CHARTS
    function buildAdminCharts(d) {
      // Bar chart — store metrics
      const barCtx = document.getElementById('barChart').getContext('2d');
      if (barChart) barChart.destroy();

      barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: ['Orders', 'Products Sold', 'Customers', 'Subscribers'],
          datasets: [{
            label: 'Count',
            data: [d.orders, d.productsSold, d.newCustomers, d.subscribers],
            backgroundColor: [
              'rgba(243,166,200,.75)',
              'rgba(158,203,255,.75)',
              'rgba(217,183,238,.75)',
              'rgba(52,211,153,.75)'
            ],
            borderColor: [
              '#f3a6c8', '#9ecbff', '#d9b7ee', '#34d399'
            ],
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => ' ' + ctx.parsed.y.toLocaleString()
              }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { weight: '600', size: 12 } } },
            y: {
              grid: { color: '#f0f0f0' }, beginAtZero: true,
              ticks: { precision: 0, font: { size: 11 } }
            }
          }
        }
      });

      // Donut chart — audience: customers vs. subscribers
      const donutCtx = document.getElementById('donutChart').getContext('2d');
      if (donutChart) donutChart.destroy();

      const orderedOnce = d.newCustomers;
      const subOnly = Math.max(0, d.subscribers - orderedOnce);

      donutChart = new Chart(donutCtx, {
        type: 'doughnut',
        data: {
          labels: ['Ordered Customers', 'Subscribers (no order)', 'Products per order (×10)'],
          datasets: [{
            data: [
              orderedOnce,
              subOnly,
              d.orders > 0 ? Math.round((d.productsSold / d.orders) * 10) : 0
            ],
            backgroundColor: ['#f3a6c8', '#9ecbff', '#d9b7ee'],
            borderColor: ['#fff', '#fff', '#fff'],
            borderWidth: 3,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { padding: 14, font: { size: 11, weight: '600' }, usePointStyle: true }
            },
            tooltip: {
              callbacks: {
                label: ctx => ' ' + ctx.label + ': ' + ctx.parsed.toLocaleString()
              }
            }
          }
        }
      });
    }

    // NEWSLETTER — QUICK SEND
    function sendQuickNewsletter() {
      if (!confirm('Send the default ART&INK newsletter to all subscribers?')) return;

      const token = sessionStorage.getItem('adminToken');
      console.log('Quick send - token:', token); // Debug log

      if (!token) {
        console.log('No token found in sessionStorage'); // Debug log
        showToast('Session expired. Please login again.', 'fail');
        logout();
        return;
      }

      const fd = new URLSearchParams();
      fd.append('action', 'sendCustomNewsletter');
      fd.append('subject', '🎨 New Designs from ART&INK!');
      fd.append('content', `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ART&INK Newsletter</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:40px auto;background:#ffffff;padding:30px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,0.06);">
        
        <!-- Header -->
        <div style="text-align:center;margin-bottom:30px;">
            <h1 style="margin:0;color:#333;font-size:28px;">🎨 New Designs from ART&INK!</h1>
        </div>

        <!-- Main Content -->
        <div style="color:#666666;font-size:14px;line-height:1.6;">
            <p style="margin:25px 0;">Hey creative soul! 🎨</p>
            
            <p style="margin:25px 0;">
                We've got some amazing new designs dropping soon, plus exclusive offers just for our subscribers. 
                Be the first to know about limited editions and special promotions!
            </p>
        </div>
        
        <!-- Feature Box -->
        <div style="background:#f3a6c1;padding:25px;border-radius:10px;margin:30px 0;">
            <h3 style="color:#ffffff;margin:0 0 15px 0;font-size:18px;">✨ What's New:</h3>
            <ul style="color:#ffffff;margin:0;padding-left:25px;font-size:14px;line-height:1.8;">
                <li style="margin-bottom:8px;">Exclusive design previews</li>
                <li style="margin-bottom:8px;">Early access to new drops</li>
                <li style="margin-bottom:8px;">Behind-the-scenes content</li>
                <li style="margin-bottom:8px;">Special subscriber offers</li>
            </ul>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align:center;margin:40px 0;">
            <a href="https://art-ink-pages.dev/" 
               style="background:#3b82f6;color:#ffffff;padding:15px 35px;text-decoration:none;
                      border-radius:25px;font-weight:bold;font-size:16px;display:inline-block;">
                Shop Now →
            </a>
        </div>

        <!-- Footer -->
        <div style="color:#666666;font-size:13px;margin-top:40px;padding-top:20px;border-top:1px solid #eeeeee;">
            <p style="margin:0 0 15px 0;">
                Thanks for being part of our creative journey!<br>
                Questions? Reply to this email anytime.
            </p>
            <p style="margin:0;">
                <small>ART&INK Shop</small>
            </p>
        </div>

    </div>
</body>
</html>
      `);
      fd.append('token', token);

      console.log('Sending request with token:', token); // Debug log

      fetch(API_URL, { method: 'POST', body: fd })
        .then(r => r.json())
        .then(res => {
          console.log('Response:', res); // Debug log
          if (res.success) {
            const n = res.data?.sentTo ?? res.data?.message ?? '?';
            showToast('✅ Newsletter sent to ' + n + ' subscribers!', 'ok');
          } else {
            if (res.message === 'Unauthorized') {
              showToast('Session expired. Please login again.', 'fail');
              logout();
            } else {
              showToast('❌ Failed: ' + (res.message || 'Unknown error'), 'fail');
            }
          }
        })
        .catch(() => {
          showToast('❌ Network error — could not reach server.', 'fail');
        });
    }

    // NEWSLETTER — CUSTOM EDITOR
    function showEmailEditor() {
      document.getElementById('email-modal').classList.remove('hidden');
    }

    function closeEmailEditor() {
      document.getElementById('email-modal').classList.add('hidden');
    }

    function previewEmail() {
      const html = document.getElementById('email-content').value;
      const box = document.getElementById('email-preview');

      // Sanitize HTML to prevent XSS attacks
      // Only allow safe formatting tags, block scripts and dangerous attributes
      const cleanHtml = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'img', 'div', 'span', 'br'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style'],
        FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
        ALLOW_DATA_URI: false,
        ALLOW_UNKNOWN_PROTOCOLS: false
      });

      box.innerHTML = cleanHtml || '<span style="color:#aaa;font-size:.85rem;">Nothing to preview.</span>';
    }

    function sendCustomNewsletter() {
      console.log("=== SEND CUSTOM NEWSLETTER DEBUG ===");

      const token = sessionStorage.getItem('adminToken');
      const subject = document.getElementById('email-subject').value.trim();
      const content = document.getElementById('email-content').value.trim();

      console.log("Token from sessionStorage:", token ? "Present" : "Missing");
      console.log("Subject:", subject);
      console.log("Content length:", content.length);
      console.log("Content preview:", content.substring(0, 100) + "...");

      if (!token) {
        showToast('Session expired. Please login again.', 'fail');
        logout();
        return;
      }

      if (!subject || !content) {
        showToast('Please fill in Subject and HTML Content.', 'fail');
        console.log("Error: Missing subject or content");
        return;
      }
      if (!confirm('Send "' + subject + '" to all subscribers?')) return;

      const sendBtn = document.getElementById('btn-send-email');
      sendBtn.disabled = true;
      sendBtn.textContent = '⏳ Sending…';

      const fd = new URLSearchParams();
      fd.append('subject', subject);
      fd.append('content', content);
      fd.append('action', 'sendCustomNewsletter');
      fd.append('token', token);

      fetch(API_URL, { method: 'POST', body: fd })
        .then(r => r.json())
        .then(res => {
          sendBtn.disabled = false;
          sendBtn.textContent = '📧 Send to All Subscribers';

          if (res.success) {
            const n = res.data?.sentTo ?? '?';
            showToast('✅ Sent to ' + n + ' subscribers!', 'ok');
            closeEmailEditor();
            document.getElementById('email-subject').value = '';
            document.getElementById('email-content').value = '';
            document.getElementById('email-preview').innerHTML =
              '<span style="color:#aaa;font-size:.85rem;">Click Preview to render HTML…</span>';
          } else {
            showToast('❌ Failed: ' + (res.message || 'Error'), 'fail');
          }
        })
        .catch(() => {
          sendBtn.disabled = false;
          sendBtn.textContent = '📧 Send to All Subscribers';
          showToast('❌ Network error. Try again.', 'fail');
        });
    }

    // Make functions globally available
    window.attemptLogin = attemptAdminLogin;
    window.cancelLogin = cancelLogin;
    window.logout = logout;
    window.refreshData = refreshData;
    window.sendQuickNewsletter = sendQuickNewsletter;
    window.showEmailEditor = showEmailEditor;
    window.closeEmailEditor = closeEmailEditor;
    window.previewEmail = previewEmail;
    window.sendCustomNewsletter = sendCustomNewsletter;
  }

  // Setup animated navigation (for all pages)
  if (typeof gsap !== 'undefined') {
    const open = document.querySelector('.nav-container');
    const close = document.querySelector('.close');
    const nav = document.querySelector('nav');
    var tl = gsap.timeline({ defaults: { duration: 1, ease: 'expo.inOut' } });

    if (open && close && nav) {
      open.addEventListener('click', () => {
        if (tl.reversed()) {
          tl.reverse();
          nav.classList.remove('open');
          open.classList.remove('hidden');
        } else {
          nav.classList.add('open');
          open.classList.add('hidden');
          tl.to(nav, { right: 0 })
            .to('nav ul li a', {
              opacity: 1,
              pointerEvents: 'all',
              stagger: .2,
              y: 0
            }, '-=.8')
            .to('.close', {
              opacity: 1,
              pointerEvents: 'all'
            }, "-=.8")
            .to('nav h2', {
              opacity: 1,
              y: 0
            }, '-=1');
        }
      });

      close.addEventListener('click', () => {
        tl.reverse();
        nav.classList.remove('open');
        open.classList.remove('hidden');
      });

      // Reset timeline when it completes to prevent breaking
      tl.eventCallback('onReverseComplete', () => {
        nav.classList.remove('open');
        open.classList.remove('hidden');
      });
    }
  }
});
