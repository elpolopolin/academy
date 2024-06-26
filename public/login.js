const mensajeError = document.getElementsByClassName("error")[0]

document.getElementById("login-form").addEventListener("submit",async (e)=>{
  e.preventDefault();
  const username = e.target.children.user.value.toLowerCase();;
  const password = e.target.children.password.value;


  const res = await fetch("http://localhost:4000/api/login",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body: JSON.stringify({
      username,password
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
})
