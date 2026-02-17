/*************************************************
 * 🎁 ART&INK SHOP – FRONTEND LOGIC
 * Product Select • Turnstile • Slip Upload
 * OCR Amount Display
 *************************************************/

// ========== PRODUCT SELECT (HOME PAGE) ==========
function goOrder(item, price) {

  // Store selected product
  localStorage.setItem("item", item);
  localStorage.setItem("price", price);

  // Navigate to order page
  window.location.href = "order.html";
}


// ========== TURNSTILE ==========
let turnstileToken = null;

function onTurnstileSuccess(token) {
  turnstileToken = token;

  const btn = document.getElementById("submitBtn");
  if (btn) btn.disabled = false;
}


// ========== SUBMIT ORDER ==========
function submitOrder() {

  const submitBtn = document.getElementById("submitBtn");
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const qty = Number(document.getElementById("qty").value);
  const slipInput = document.getElementById("slip");

  if (!turnstileToken)
    return showError("Please verify you are human.");

  if (!email.includes("@"))
    return showError("Invalid email");

  if (!qty || qty < 1)
    return showError("Invalid quantity");

  if (!slipInput.files.length)
    return showError("Upload payment slip");

  const file = slipInput.files[0];

  if (file.size > 5 * 1024 * 1024)
    return showError("Slip too large (max 5MB)");

  submitBtn.disabled = true;

  const reader = new FileReader();

  reader.onload = function () {

    const base64Image = reader.result.split(",")[1];

    const formData = new URLSearchParams();
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("item", localStorage.getItem("item"));
    formData.append("price", localStorage.getItem("price"));
    formData.append("quantity", qty);
    formData.append("base64Image", base64Image);
    formData.append("turnstileToken", turnstileToken);

    fetch("YOUR_APPS_SCRIPT_WEBAPP_URL", {
      method: "POST",
      body: formData
    })
    .then(res => res.json())
    .then(data => {

      if (!data.success) {
        throw new Error(data.message);
      }

      // ========== OCR DISPLAY ==========
      const detected = data.data.detectedAmount;
      const total =
        parseFloat(localStorage.getItem("price")) * qty;

      const ocrBox = document.getElementById("ocrBox");
      const detectedSpan =
        document.getElementById("detectedAmount");
      const matchStatus =
        document.getElementById("matchStatus");

      if (ocrBox) ocrBox.style.display = "block";

      if (detected) {

        detectedSpan.textContent = "฿" + detected;

        if (parseFloat(detected) ===
            parseFloat(total.toFixed(2))) {

          matchStatus.innerHTML =
            "✅ Amount matches order total.";
          matchStatus.style.color = "green";

        } else {

          matchStatus.innerHTML =
            "⚠️ Amount does NOT match order total.";
          matchStatus.style.color = "red";
        }

      } else {

        detectedSpan.textContent = "Not detected";
        matchStatus.innerHTML =
          "⚠️ OCR could not detect amount.";
        matchStatus.style.color = "orange";
      }

      submitBtn.disabled = false;

    })
    .catch(err => {
      showError(err.message || "Submission failed");
      resetTurnstile();
      submitBtn.disabled = false;
    });
  };

  reader.onerror = function () {
    showError("Failed to read image");
    submitBtn.disabled = false;
  };

  reader.readAsDataURL(file);
}


// ========== HELPERS ==========
function showError(message) {

  const error = document.getElementById("error");

  if (error) {
    error.textContent = message;
    error.style.display = "block";
  }
}

function resetTurnstile() {

  if (window.turnstile)
    window.turnstile.reset();

  turnstileToken = null;
}
