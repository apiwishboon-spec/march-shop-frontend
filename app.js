/*************************************************
 * ART&INK SHOP – AUTO QR VERSION
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
    qrImg.src = data.data.qrImage;

    document.getElementById("qrTotal").textContent =
      "฿" + data.data.total;

    enableDownload(qrImg.src);
  })
  .catch(err => {
    console.error("QR failed:", err.message);
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


