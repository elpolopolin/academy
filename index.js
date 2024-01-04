
import revisarCookie from "./helpers/revisarCookies.js";
import {getCoachbyId, getBillsbyId, UpdateCoach, getCoaches, getAllbills, UpdateCoachAdmin, deleteCoach, getBillById, getCoachesElement, CreateBilll, 
  updateCoachImage, getunpaidBills, getBillsForCurrentMonth, getCoachStudents, UpdateStudentAdmin, becarstudent, sacarbeca, deletestudent, getCoachClasses, createNewClass,   } from "./helpers/db.js";
import { registerStudent, deleteUnpaidStudents, getStudents } from "./helpers/studentDb.js";
import  express  from "express";
import cookieParser from 'cookie-parser';
//Fix para __direname
import path from 'path';
import {fileURLToPath} from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import {methods as authentication} from "./controllers/authentication.controller.js"
import {methods as authorization} from "./middlewares/authorization.js";
//import { upload } from "./helpers/uploadMulter.js";
import multer from 'multer';
import cron from "node-cron"; //automatizacion de request a la bd todos los dias a las 3am por ejemplo
//Payment routes
import paymentRoutes from './src/routes/payment.routes.js'
//students routes
import studentsRoutes from './src/routes/students.routes.js'


//Server
const app = express();
app.set("port",4000);
app.listen(app.get("port"));
console.log("Servidor corriendo en puerto",app.get("port"));

//Configuración
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(cookieParser())

cron.schedule('9 3 * * *', () => {
  deleteUnpaidStudents();
});

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
      res.render(__dirname + "/pages/payment/viewbill.ejs", {bill});
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
  console.log("las bills", bills)
  res.render(__dirname + "/pages/admin/bills.ejs", {bills});
});
app.get("/unpaidbills",authorization.soloAdmin, async function (req,res) {
  const bills = await getunpaidBills();
  res.render(__dirname + "/pages/admin/unpaidbills.ejs", {bills});
});
app.get("/monthbills",authorization.soloAdmin, async function (req,res) {
  const all = await getBillsForCurrentMonth();
  const bills = all.bills;
  const monthIncome = all.monthIncome;
  res.render(__dirname + "/pages/admin/monthbills.ejs", {bills, monthIncome});
});

app.get("/allstudents",authorization.soloAdmin, async function (req,res) {
  const students = await getStudents();
  res.render(__dirname + "/pages/admin/students.ejs", {students});
});

app.get("/ver-coaches",authorization.soloAdmin, async function(req,res) {
  const coaches = await getCoaches();
  res.render(__dirname + "/pages/admin/coaches.ejs", { coaches });
});
app.get("/coachInvoices/:id",authorization.soloAdmin, async function(req,res) {
  const coachId = req.params.id;
 const coachBills = await getBillsbyId(coachId)
 const coach = await getCoachbyId(coachId)
 res.render(__dirname + "/pages/admin/coachInvoices.ejs", { coachBills, coach });
});
app.get("/noAccess",(req,res)=> res.sendFile(__dirname + "/pages/admin/noperms.html")); //esto hay q reacerlo no tiene sentido..
app.post('/api/updatecoachadmin',authorization.soloAdmin, (req, res) => UpdateCoachAdmin(req, res));
app.post('/api/deletecoach',authorization.soloAdmin, (req, res) => deleteCoach(req, res));
app.post('/api/updatestudentadmin',authorization.soloAdmin, (req, res) => UpdateStudentAdmin(req, res));
app.post('/api/becarstudent',authorization.soloAdmin, (req, res) => becarstudent(req, res));
app.post('/api/sacarbeca',authorization.soloAdmin, (req, res) => sacarbeca(req, res));
app.post('/api/deletestudent',authorization.soloAdmin, (req, res) => deletestudent(req, res));
app.post('/api/register-student',authorization.soloPublico, (req, res) => registerStudent(req, res));
//
///api/

//coaches
app.get("/mybills",authorization.soloCoaches, async function(req,res) {
  const coaches = await getCoaches();
  const coachId = revisarCookie(req, coaches, "id");
  const coachBills = await getBillsbyId(coachId);
  const coachStudents = await getCoachStudents(coachId);
  console.log(coachBills)
  res.render(__dirname + "/pages/coaches/index.ejs", { coachBills, coachStudents });
});

app.get("/group-classes",authorization.soloCoaches, async function(req,res) {
  const coaches = await getCoaches();
  const coachId = revisarCookie(req, coaches, "id");
  const coachClasses = await getCoachClasses(coachId);
  console.log(coachClasses);
  res.render(__dirname + "/pages/coaches/groupclasses.ejs", { coachClasses });
});

app.post("/api/newClass",authorization.soloCoaches, (req, res) => createNewClass(req, res));
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
app.post('/api/updatecoach', (req, res) => UpdateCoach(req, res));


//payment
app.use(paymentRoutes);
app.use(studentsRoutes);

//upload coach image
const multerMiddleware = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/imagenesCoaches');
    },
    filename: function (req, file, cb) {
      const extname = path.extname(file.originalname);
      const filename = `${Date.now()}${extname}`;
      cb(null, filename);
    },
  }),
  fileFilter: function (req, file, cb) {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const extname = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(extname)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen con extensiones .jpg, .jpeg, .png o .gif'), false);
    }
  },
});
app.post('/api/uploadimagecoach',authorization.soloCoaches , multerMiddleware.single('imagenCoach'), (req, res) => updateCoachImage(req, res));

export default app;