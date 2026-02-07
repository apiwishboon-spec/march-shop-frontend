/***************************************
 * ART&INK STUDIO – FRONTEND LOGIC
 * Clean UX • Anti-double-submit • Spinner
 ***************************************/

/* =====================
   GO TO ORDER PAGE
===================== */
function goOrder(item, price) {
  localStorage.setItem("item", item);
  localStorage.setItem("price", price);
  location.href = "order.html";
}

/* =====================
   SUBMIT ORDER
===================== */
let isSubmitting = false; // 🔒 anti-double-submit flag

function submitOrder() {
  if (isSubmitting) return; // extra safety net

  const submitBtn = document.getElementById("submitBtn");
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const qty = Number(document.getElementById("qty").value);
  const error = document.getElementById("error");

  error.style.display = "none";

  // 🧪 basic validation (keep it sane)
  if (!email.includes("@")) {
    error.textContent = "Invalid email address";
    error.style.display = "block";
    return;
  }

  if (!qty || qty < 1) {
    error.textContent = "Quantity must be at least 1";
    error.style.display = "block";
    return;
  }

  /* ===== LOCK UI ===== */
  isSubmitting = true;
  submitBtn.disabled = true;

  // 🔄 swap text → spinner
  submitBtn.innerHTML = `<div class="spinner"></div>`;

  const payload = {
    email,
    phone,
    item: localStorage.getItem("item"),
    price: Number(localStorage.getItem("price")),
    quantity: qty
  };

  fetch(
    "https://script.google.com/macros/s/AKfycbwKYXw52HpjFeKPBwkXpRc7PpiP6itwKkPXnATmmAAAaZFJW7c0Hm0MlpqdgmWRKfrXLg/exec",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  )
    .then(r => r.json())
    .then(res => {
      if (!res.success) throw new Error(res.message);

      // ✅ SUCCESS → redirect
      location.href = `success.html?id=${res.data.orderId}`;
    })
    .catch(err => {
      // ❌ ERROR → unlock UI
      error.textContent = err.message || "Order failed. Please try again.";
      error.style.display = "block";

      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit order";
    });
}

