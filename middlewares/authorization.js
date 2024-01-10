import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import { getCoaches } from "../helpers/db.js";
import { getStudents } from "../helpers/studentDb.js";

dotenv.config();
//const coaches = await getCoaches();
  
async function soloAdmin(req, res, next) {
  const coaches = await getCoaches(); 
  const logueado = revisarCookie(req, coaches);
  const admin = isAdmin(req, coaches);

  if (logueado && admin) return next();
  if (logueado){
    return res.redirect("/mybills");
  } else{
    return res.redirect("/students");
  }
  
}
async function soloCoaches(req, res, next) {
  const coaches = await getCoaches(); 
  const students = await getStudents();
  const logueado = revisarCookie(req, coaches);

  if (logueado) {return next();}else{
    const logueadoStudent = revisarCookieStudents(req, students);
    if (logueadoStudent){
      return res.redirect("/students");
    }else{
      return res.redirect("/");
    }
  }
  
}
async function soloStudents(req, res, next) {
  const students = await getStudents();
  const logueado = revisarCookieStudents(req, students);
  ////console.log("auth ",logueado);
  if (logueado) return next();
    return res.redirect("/"); 
}

function revisarCookieStudents(req, users) {
  try {
    const cookieJWT = req.headers.cookie.split("; ").find(cookie => cookie.startsWith("jwt=")).slice(4);
    const decodificada = jsonwebtoken.verify(cookieJWT, process.env.JWT_SECRET);
    const usuarioAResvisar = users.find(user => user.email === decodificada.username);
    
    if (!usuarioAResvisar) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
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
    // //console.log(decodificada)
    const usuarioAResvisar = coaches.find(coach => coach.username === decodificada.username);
   // //console.log("tetos: ", usuarioAResvisar)
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
    ////console.log(decodificada)
    const usuarioAResvisar = coaches.find(coach => coach.username === decodificada.username);
  //  //console.log("tetas: ", usuarioAResvisar)
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
  soloStudents,
}