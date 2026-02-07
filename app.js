function goOrder(item, price) {
  localStorage.setItem("item", item);
  localStorage.setItem("price", price);
  location.href = "order.html";
}

function submitOrder() {
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const qty = Number(document.getElementById("qty").value);
  const error = document.getElementById("error");

  error.style.display = "none";

  if (!email.includes("@")) {
    error.textContent = "Invalid email";
    error.style.display = "block";
    return;
  }

  const payload = {
    email,
    phone,
    item: localStorage.getItem("item"),
    price: Number(localStorage.getItem("price")),
    quantity: qty
  };

  fetch("https://script.google.com/macros/s/AKfycbwKYXw52HpjFeKPBwkXpRc7PpiP6itwKkPXnATmmAAAaZFJW7c0Hm0MlpqdgmWRKfrXLg/exec", {
    method: "POST",
    body: JSON.stringify(payload)
  })
    .then(r => r.json())
    .then(res => {
      if (!res.success) throw new Error(res.message);
      location.href = `success.html?id=${res.data.orderId}`;
    })
    .catch(err => {
      error.textContent = err.message;
      error.style.display = "block";
    });
}


