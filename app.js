/*************************************************
 * 🎁 ART&INK SHOP – FRONTEND LOGIC
 * Auto PromptPay QR + Slip Upload
 *************************************************/

let turnstileToken = null;
let generatedPayload = null;


// ========== TURNSTILE ==========
function onTurnstileSuccess(token) {
  turnstileToken = token;
  tryGenerateQR();
}


// ========== AUTO GENERATE QR ==========
function tryGenerateQR() {

  const email = document.getElementById("email").value.trim();
  const qty = Number(document.getElementById("qty").value);
  const price = parseFloat(localStorage.getItem("price"));
  const item = localStorage.getItem("item");

  if (!turnstileToken) return;
  if (!email.includes("@")) return;
  if (!qty || qty < 1) return;

  const formData = new URLSearchParams();
  formData.append("email", email);
  formData.append("phone", document.getElementById("phone").value.trim());
  formData.append("item", item);
  formData.append("price", price);
  formData.append("quantity", qty);
  formData.append("turnstileToken", turnstileToken);

  fetch("https://script.google.com/macros/s/AKfycbxENBG6cKm3ImJd_6gjvxCUnM-hG0xeNhPhjLUleDCyh0JsXhkkG7wOwkBjRW43j-88mg/exec", {
    method: "POST",
    body: formData
  })
  .then(res => res.json())
  .then(data => {

    if (!data.success) {
      throw new Error(data.message);
    }

    generatedPayload = data.data.promptPayPayload;

    const qrImage = document.getElementById("dynamicQR");
    const totalText = document.getElementById("qrTotal");

    qrImage.src = data.data.qrImage;
    totalText.textContent = "฿" + data.data.total;

  })
  .catch(err => {
    console.error("QR generation failed:", err.message);
  });
}


// ========== SUBMIT ORDER ==========
function submitOrder() {

  const submitBtn = document.getElementById("submitBtn");
  const slipInput = document.getElementById("slip");

  if (!generatedPayload)
    return showError("QR not generated yet.");

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
    formData.append("email", document.getElementById("email").value.trim());
    formData.append("phone", document.getElementById("phone").value.trim());
    formData.append("item", localStorage.getItem("item"));
    formData.append("price", localStorage.getItem("price"));
    formData.append("quantity", document.getElementById("qty").value);
    formData.append("base64Image", base64Image);
    formData.append("turnstileToken", turnstileToken);

    fetch("https://script.google.com/macros/s/AKfycbxENBG6cKm3ImJd_6gjvxCUnM-hG0xeNhPhjLUleDCyh0JsXhkkG7wOwkBjRW43j-88mg/exec", {
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
      submitBtn.disabled = false;
    });
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
