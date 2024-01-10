const mensajeError = document.getElementsByClassName("error")[0];

document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const requestBody = {
    name: formData.get("name"),
    surname: formData.get("surname"),
    user: formData.get("user").toLowerCase(), // Convertir a minúsculas
    password: formData.get("password"),
    email: formData.get("email").toLowerCase() || "null", // Convertir a minúsculas
    phone: formData.get("phone-number") || "null",
  };

  const res = await fetch("http://localhost:4000/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
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

