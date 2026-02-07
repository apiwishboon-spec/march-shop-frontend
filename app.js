/***************************************
 * ART&INK STUDIO – FRONTEND LOGIC (FIXED)
 ***************************************/

let isSubmitting = false;

function submitOrder() {
  if (isSubmitting) return;

  const submitBtn = document.getElementById("submitBtn");
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const qty = Number(document.getElementById("qty").value);
  const error = document.getElementById("error");

  error.style.display = "none";

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

  isSubmitting = true;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<div class="spinner"></div>`;

  const payload = new URLSearchParams({
    email,
    phone,
    item: localStorage.getItem("item"),
    price: localStorage.getItem("price"),
    quantity: qty
  });

  fetch(
    "https://script.google.com/macros/s/AKfycbwKYXw52HpjFeKPBwkXpRc7PpiP6itwKkPXnATmmAAAaZFJW7c0Hm0MlpqdgmWRKfrXLg/exec",
    {
      method: "POST",
      body: payload
    }
  )
    .then(r => r.json())
    .then(res => {
      if (!res.success) throw new Error(res.message);
      location.href = `success.html?id=${res.data.orderId}`;
    })
    .catch(err => {
      error.textContent = err.message || "Order failed. Please try again.";
      error.style.display = "block";

      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit order";
    });
}
