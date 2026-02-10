/* =========================
   ORDER FLOW CONTROLLER
   ========================= */

// 🛒 move to order page with state
function goOrder(item, price) {
  const order = { item, price };
  localStorage.setItem("order", JSON.stringify(order));
  location.href = "order.html";
}

/* =========================
   SUBMIT ORDER
   ========================= */
function submitOrder() {
  const submitBtn = document.getElementById("submitBtn");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const qtyInput = document.getElementById("qty");
  const slipInput = document.getElementById("slipUrl");
  const errorBox = document.getElementById("error");

  // 🚫 anti-rage-click system
  if (submitBtn.disabled) return;

  // reset UI
  errorBox.style.display = "none";
  errorBox.textContent = "";

  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const qty = Number(qtyInput.value);
  const slipUrl = slipInput.value.trim();

  // 🧪 validation (strict but human)
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return showError("Invalid email address.");
  }

  if (!phone || phone.length < 8) {
    return showError("Invalid phone number.");
  }

  if (!qty || qty <= 0) {
    return showError("Quantity must be at least 1.");
  }

  if (!slipUrl.startsWith("http")) {
    return showError("Slip image URL is required.");
  }

  // 📦 load order data
  const storedOrder = localStorage.getItem("order");
  if (!storedOrder) {
    return showError("Order data missing. Wrong page flow.");
  }

  const { item, price } = JSON.parse(storedOrder);

  // 🔒 lock UI
  submitBtn.disabled = true;
  submitBtn.classList.add("loading");

  // 🧾 Apps Script–compatible payload
  const formData = new URLSearchParams();
  formData.append("email", email);
  formData.append("phone", phone);
  formData.append("item", item);
  formData.append("price", price);
  formData.append("qty", qty);
  formData.append("slipUrl", slipUrl);

  // 🌐 send to backend
  fetch("https://script.google.com/macros/s/AKfycbwKYXw52HpjFeKPBwkXpRc7PpiP6itwKkPXnATmmAAAaZFJW7c0Hm0MlpqdgmWRKfrXLg/exec", {
    method: "POST",
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        throw new Error(data.message || "Backend rejected order");
      }

      // 🏁 success page
      location.href = `success.html?id=${data.message}`;
    })
    .catch(err => {
      showError(err.message || "Something broke. Backend vibes.");
      submitBtn.disabled = false;
      submitBtn.classList.remove("loading");
    });
}

/* =========================
   UI HELPERS
   ========================= */
function showError(message) {
  const errorBox = document.getElementById("error");
  errorBox.textContent = message;
  errorBox.style.display = "block";
}
