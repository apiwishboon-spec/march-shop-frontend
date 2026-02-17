/*************************************************
 * ART&INK SHOP – FIXED VERSION
 *************************************************/

let turnstileToken = null;
let generatedPayload = null;

const API_URL = "https://script.google.com/macros/s/AKfycbxENBG6cKm3ImJd_6gjvxCUnM-hG0xeNhPhjLUleDCyh0JsXhkkG7wOwkBjRW43j-88mg/exec";

document.addEventListener("DOMContentLoaded", () => {

  const item = localStorage.getItem("item");
  const price = parseFloat(localStorage.getItem("price"));

  if (!item || !price) {
    location.href = "index.html";
    return;
  }

  const itemText = document.getElementById("item-text");
  const qtyInput = document.getElementById("qty");
  const emailInput = document.getElementById("email");

  itemText.textContent = `${item} — ฿${price} each`;

  updateTotal();
  tryGenerateQR();

  qtyInput.addEventListener("input", () => {
    updateTotal();
    tryGenerateQR();
  });

  emailInput.addEventListener("input", tryGenerateQR);
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
// TURNSTILE CALLBACK
// ================================
function onTurnstileSuccess(token) {
  turnstileToken = token;
}


// ================================
// GENERATE QR (NO TURNSTILE BLOCK)
// ================================
function tryGenerateQR() {

  const email = document.getElementById("email").value.trim();
  const qty = Number(document.getElementById("qty").value);
  const price = parseFloat(localStorage.getItem("price"));
  const item = localStorage.getItem("item");

  if (!email.includes("@")) return;
  if (!qty || qty < 1) return;

  const formData = new URLSearchParams();
  formData.append("email", email);
  formData.append("phone", document.getElementById("phone").value.trim());
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

    document.getElementById("dynamicQR").src = data.data.qrImage;
    document.getElementById("qrTotal").textContent = "฿" + data.data.total;

  })
  .catch(err => {
    console.error("QR failed:", err.message);
  });
}


// ================================
// SUBMIT ORDER (TURNSTILE REQUIRED)
// ================================
function submitOrder() {

  const slipInput = document.getElementById("slip");

  if (!turnstileToken)
    return showError("Please verify you are human.");

  if (!generatedPayload)
    return showError("QR not generated yet.");

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

    fetch(API_URL, {
      method: "POST",
      body: formData
    })
    .then(res => res.json())
    .then(data => {

      if (!data.success) {
        throw new Error(data.message);
      }

      alert("Order submitted successfully!");
      localStorage.clear();
      location.href = "index.html";

    })
    .catch(err => {
      showError(err.message || "Submission failed");
    });
  };

  reader.readAsDataURL(file);
}


// ================================
// HELPERS
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
