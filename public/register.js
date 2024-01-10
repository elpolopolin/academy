const mensajeError = document.getElementsByClassName("error")[0];

document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);

  const res = await fetch("https://polonsky.relied.cloud//api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: formData.get("name"),
      surname: formData.get("surname"),
      user: formData.get("user") ,
      password: formData.get("password"),
      email: formData.get("email") || "null",
      phone: formData.get("phone-number") || "null",
      
    })
  });

  if (!res.ok) {
    const errorResponse = await res.json();
    mensajeError.textContent = errorResponse.message; // Set the error message
    mensajeError.classList.toggle("escondido", false);
    return;
  }

  const resJson = await res.json();
  if (resJson.redirect) {
    window.location.href = resJson.redirect;
  }
});

