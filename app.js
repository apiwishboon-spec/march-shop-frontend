/*************************************************
 * 🎁 ART&INK SHOP – FRONTEND LOGIC (NO OCR)
 * Dynamic PromptPay QR Flow
 *************************************************/

let turnstileToken = null;
let generatedQR = null;


// ========== TURNSTILE ==========
function onTurnstileSuccess(token) {
  turnstileToken = token;

  const btn = document.getElementById("generateBtn");
  if (btn) btn.disabled = false;
}


// ========== GENERATE QR ==========
function generateQR() {

  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const qty = Number(document.getElementById("qty").value);

  if (!turnstileToken)
    return showError("Please verify you are human.");

  if (!email.includes("@"))
    return showError("Invalid email");

  if (!qty || qty < 1)
    return showError("Invalid quantity");

  const price = parseFloat(localStorage.getItem("price"));
  const item = localStorage.getItem("item");
  const total = (price * qty).toFixed(2);

  const formData = new URLSearchParams();
  formData.append("email", email);
  formData.append("phone", phone);
  formData.append("item", item);
  formData.append("price", price);
  formData.append("quantity", qty);
  formData.append("turnstileToken", turnstileToken);

  fetch("YOUR_WEBAPP_URL_HERE", {
    method: "POST",
    body: formData
  })
  .then(res => res.json())
  .then(data => {

    if (!data.success) {
      throw new Error(data.message);
    }

    generatedQR = data.data.qrImage;

    document.getElementById("qrContainer").style.display = "block";
    document.getElementById("qrImage").src = generatedQR;
    document.getElementById("payTotal").textContent =
      "฿" + total;

  })
  .catch(err => {
    showError(err.message || "Failed to generate QR");
    resetTurnstile();
  });
}


// ========== SUBMIT CONFIRMATION ==========
function submitConfirmation() {

  if (!generatedQR)
    return showError("Generate QR and pay first.");

  alert("Order submitted. Waiting for payment verification.");
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
