import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import { getCoaches } from "../helpers/db.js";

dotenv.config();
//const coaches = await getCoaches();
  
async function soloAdmin(req, res, next) {
  const coaches = await getCoaches(); 
  const logueado = revisarCookie(req, coaches);
  const admin = isAdmin(req, coaches);

  if (logueado && admin) return next();
  return res.redirect("/Account");
}
async function soloCoaches(req, res, next) {
  const coaches = await getCoaches(); 
  const logueado = revisarCookie(req, coaches);

  if (logueado) return next();
  return res.redirect("/");
}
async function soloPublico(req, res, next) {
  const coaches = await getCoaches(); 
  const logueado = revisarCookie(req, coaches);

  if (!logueado) return next();
  return res.redirect("/admin");
}

 function revisarCookie(req, coaches){
 try{
    const cookieJWT = req.headers.cookie.split("; ").find(cookie => cookie.startsWith("jwt=")).slice(4);
    const decodificada = jsonwebtoken.verify(cookieJWT,process.env.JWT_SECRET);
    // console.log(decodificada)
    const usuarioAResvisar = coaches.find(coach => coach.username === decodificada.username);
   // console.log("tetos: ", usuarioAResvisar)
    if(!usuarioAResvisar){
      return false
    }
    return true;
  }
  catch{
    return false;
  }
}

 function isAdmin(req, coaches) {
 
  try{
    const cookieJWT = req.headers.cookie.split("; ").find(cookie => cookie.startsWith("jwt=")).slice(4);
    const decodificada = jsonwebtoken.verify(cookieJWT,process.env.JWT_SECRET);
    console.log(decodificada)
    const usuarioAResvisar = coaches.find(coach => coach.username === decodificada.username);
  //  console.log("tetas: ", usuarioAResvisar)
    if(usuarioAResvisar.admin === 0){
      return false
    }
    return true;
  }
  catch{
    return false;
  }
}

export const methods = {
  soloAdmin,
  soloCoaches,
  soloPublico,
}