import jsonwebtoken from "jsonwebtoken";

function revisarCookie(req, array, field){
    try{
      const cookieJWT = req.headers.cookie.split("; ").find(cookie => cookie.startsWith("jwt=")).slice(4);
      const decodificada = jsonwebtoken.verify(cookieJWT,process.env.JWT_SECRET);
      const usuarioARevisar = array.find(coach => coach.username === decodificada.username);
      if(!usuarioARevisar){
        return null;
      }
      return usuarioARevisar[field];
    }
    catch{
      return false;
    }
}

export default revisarCookie;