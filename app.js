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
  const errorBox = document.getElementById("error");

  // 🚫 anti-rage-click system
  if (submitBtn.disabled) return;

  // reset UI
  errorBox.style.display = "none";
  errorBox.textContent = "";

  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const quantity = Number(qtyInput.value);

  // 🧪 basic validation (not rocket science, but not dumb)
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return showError("Invalid email address.");
  }

  if (!quantity || quantity <= 0) {
    return showError("Quantity must be at least 1.");
  }

  // 📦 load order data
  const storedOrder = localStorage.getItem("order");
  if (!storedOrder) {
    return showError("Order data missing. Did you teleport here?");
  }

  const { item, price } = JSON.parse(storedOrder);

  // 🔒 lock UI like Fort Knox
  submitBtn.disabled = true;
  submitBtn.classList.add("loading");

  const payload = {
    email,
    phone,
    item,
    price: Number(price),
    quantity
  };

  // 🌐 send to backend overlords
  fetch("https://script.google.com/macros/s/AKfycbwKYXw52HpjFeKPBwkXpRc7PpiP6itwKkPXnATmmAAAaZFJW7c0Hm0MlpqdgmWRKfrXLg/exec", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        throw new Error(data.message || "Unknown backend errer");
      }

      // 🏁 success = GTFO to success page
      location.href = `success.html?id=${data.data.orderId}`;
    })
    .catch(err => {
      // 🔥 failure path
      showError(err.message || "Something broke. Not your fault. Probably.");
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

