/*************************************************
 * 🎁 ART&INK SHOP – FRONTEND LOGIC
 * Stable • Slip Upload • Apps Script Compatible
 *************************************************/

// ========== GO TO ORDER ==========
function goOrder(item, price) {
  localStorage.setItem("item", item);
  localStorage.setItem("price", price);
  location.href = "order.html";
}


// ========== SUBMIT ORDER ==========
function submitOrder() {

  const submitBtn = document.getElementById("submitBtn");
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const qty = Number(document.getElementById("qty").value);
  const slipInput = document.getElementById("slip");
  const error = document.getElementById("error");

  if (submitBtn.disabled) return;

  error.style.display = "none";

  // ---- Validation ----
  if (!email.includes("@")) {
    return showError("Invalid email");
  }

  if (!qty || qty < 1) {
    return showError("Invalid quantity");
  }

  if (!slipInput.files.length) {
    return showError("Please upload payment slip");
  }

  const file = slipInput.files[0];

  if (file.size > 5 * 1024 * 1024) {
    return showError("Slip too large (max 5MB)");
  }

  // ---- Lock UI ----
  submitBtn.disabled = true;
  submitBtn.classList.add("loading");

  const reader = new FileReader();

  reader.onload = function () {

    try {

      const base64Image = reader.result.split(",")[1];

      const formData = new URLSearchParams();
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("item", localStorage.getItem("item"));
      formData.append("price", localStorage.getItem("price"));
      formData.append("quantity", qty);
      formData.append("base64Image", base64Image);

      fetch("https://script.google.com/macros/s/AKfycbwKYXw52HpjFeKPBwkXpRc7PpiP6itwKkPXnATmmAAAaZFJW7c0Hm0MlpqdgmWRKfrXLg/exec", {
        method: "POST",
        body: formData
      })
      .then(res => res.json())
      .then(data => {

        if (!data.success) {
          throw new Error(data.message);
        }

        location.href = `success.html?id=${data.data.orderId}`;

      })
      .catch(err => {
        showError(err.message);
        unlockUI();
      });

    } catch (err) {
      showError("Image processing failed");
      unlockUI();
    }

  };

  reader.onerror = function () {
    showError("Failed to read image");
    unlockUI();
  };

  reader.readAsDataURL(file);
}


// ========== HELPERS ==========
function showError(message) {
  const error = document.getElementById("error");
  error.textContent = message;
  error.style.display = "block";
}

function unlockUI() {
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = false;
  submitBtn.classList.remove("loading");
}
