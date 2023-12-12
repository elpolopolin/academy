
import revisarCookie from "./helpers/revisarCookies.js";
import {getCoachbyId, getBillsbyId, UpdateCoach, getCoaches, getAllbills, UpdateCoachAdmin, deleteCoach, getBillById, getCoachesElement, CreateBilll, } from "./helpers/db.js";
import  express  from "express";
import cookieParser from 'cookie-parser';
//Fix para __direname
import path from 'path';
import {fileURLToPath} from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import {methods as authentication} from "./controllers/authentication.controller.js"
import {methods as authorization} from "./middlewares/authorization.js";
import { upload } from "./helpers/uploadMulter.js";


//Server
const app = express();
app.set("port",4000);
app.listen(app.get("port"));
console.log("Servidor corriendo en puerto",app.get("port"));

//Configuración
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(cookieParser())


//Rutas
app.get("/",authorization.soloPublico, (req,res)=> res.sendFile(__dirname + "/pages/login.html"));

const logout = (req, res) => {
  // Limpiar la cookie jwt
  res.clearCookie('jwt', { path: '/' });

  // Redirigir al inicio
  res.redirect('/');
};

//publico
app.post("/api/login",authentication.login);
app.post("/logout", logout);
app.post("/api/register",authentication.register);
app.get("/error", function (req, res) {
  res.render(__dirname + "/pages/error.html");
});
app.get("/register",authorization.soloAdmin,(req,res)=> res.sendFile(__dirname + "/pages/admin/register.html"));
app.get("/viewbill/:id", async (req, res) => {
  try {
    let bill = await getBillById(req.params.id)
    if(bill){
      res.render(__dirname + "/pages/viewbill.ejs", {bill});
    }else{
      res.send("bill was not found")
    }
    
  } catch (error){
    res.send(error)
  }
})
//admin
app.get("/admin",authorization.soloAdmin,(req,res)=> res.sendFile(__dirname + "/pages/admin/admin.html"));

app.get("/bills",authorization.soloAdmin, async function (req,res) {
  const bills = await getAllbills();
  console.log(bills)
  res.render(__dirname + "/pages/admin/bills.ejs", {bills});
});

app.get("/ver-coaches",authorization.soloAdmin, async function(req,res) {
  const coaches = await getCoaches();
  res.render(__dirname + "/pages/admin/coaches.ejs", { coaches });
});
app.get("/noAccess",(req,res)=> res.sendFile(__dirname + "/pages/admin/noperms.html")); //esto hay q reacerlo no tiene sentido..
app.post('/api/updatecoachadmin',authorization.soloAdmin, (req, res) => UpdateCoachAdmin(req, res));
app.post('/api/deletecoach',authorization.soloAdmin, (req, res) => deleteCoach(req, res));
//

//coaches
app.get("/coaches",authorization.soloCoaches, async function(req,res) {
  const coaches = await getCoaches();
  const coachId = revisarCookie(req, coaches, "id");
  const coachBills = await getBillsbyId(coachId);
  console.log(coachBills)
  res.render(__dirname + "/pages/coaches/index.ejs", { coachBills });
});


app.post("/api/newbill",authorization.soloCoaches, (req, res) => CreateBilll(req, res));

app.get("/Account", authorization.soloCoaches, async function (req, res) {
  const coaches = await getCoaches();
  const coachId = revisarCookie(req, coaches, "id");
  console.log("id del coach", coachId);
  try {
    const coach = await getCoachbyId(coachId);
    res.render(__dirname + "/pages/coaches/account.ejs", { coach });
  } catch (error) {
    console.error("Error al obtener datos del coach:", error);
    res.redirect("/error");
    res.status(500).send("Error interno del servidor");
  }
});
app.post('/api/updatecoach', upload.single('ImagenCoach'), (req, res) => UpdateCoach(req, res));

//



export default app;