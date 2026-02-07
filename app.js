/* =====================
   PAGE TRANSITION IN
===================== */
document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("page-loaded");
});

/* =====================
   NAVIGATION
===================== */
function goOrder(item, price) {
  localStorage.setItem("item", item);
  localStorage.setItem("price", price);

  // smooth exit animation
  document.body.classList.remove("page-loaded");

  setTimeout(() => {
    location.href = "order.html";
  }, 250);
}

/* =====================
   ORDER SUBMIT
===================== */
function submitOrder() {
  const email = document.getElementById("email");
  const phone = document.getElementById("phone");
  const qty = document.getElementById("qty");
  const error = document.getElementById("error");
  const button = document.querySelector(".btn-primary");

  error.style.display = "none";
  error.classList.remove("show");

  const emailValue = email.value.trim();
  const phoneValue = phone.value.trim();
  const qtyValue = Number(qty.value);

  // basic validation (keep it clean)
  if (!emailValue.includes("@")) {
    showError("Invalid email address");
    shake(email);
    return;
  }

  if (qtyValue < 1) {
    showError("Quantity must be at least 1");
    shake(qty);
    return;
  }

  // loading state
  button.disabled = true;
  button.textContent = "Submitting...";
  button.classList.add("loading");

  const payload = {
    email: emailValue,
    phone: phoneValue,
    item: localStorage.getItem("item"),
    price: Number(localStorage.getItem("price")),
    quantity: qtyValue
  };

  fetch("https://script.google.com/macros/s/AKfycbwKYXw52HpjFeKPBwkXpRc7PpiP6itwKkPXnATmmAAAaZFJW7c0Hm0MlpqdgmWRKfrXLg/exec", {
    method: "POST",
    body: JSON.stringify(payload)
  })
    .then(r => r.json())
    .then(res => {
      if (!res.success) throw new Error(res.message);

      // smooth page exit
      document.body.classList.remove("page-loaded");

      setTimeout(() => {
        location.href = `success.html?id=${res.data.orderId}`;
      }, 300);
    })
    .catch(err => {
      showError(err.message || "Something went wrong");

      button.disabled = false;
      button.textContent = "Submit order";
      button.classList.remove("loading");
    });
}

/* =====================
   UI HELPERS
===================== */
function showError(message) {
  const error = document.getElementById("error");
  error.textContent = message;
  error.style.display = "block";

  // animate error in
  requestAnimationFrame(() => {
    error.classList.add("show");
  });
}

function shake(el) {
  el.classList.add("shake");
  setTimeout(() => el.classList.remove("shake"), 400);
}
