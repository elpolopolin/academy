import { Router } from "express";
import express from "express";
import { createSession } from "../../controllers/paymentStudent.js";
import { getInProgressStudents, updateStudentState, getStudentById, deleteUnpaidStudents, deleteUser, getStudents, getcoachSelected, updateStudentsCoach, getBillById, updateStudent, updateStudentImage, getCoachClasses, getClassById, logUserAttendance, joinClass, leaveClass } from "../../helpers/studentDb.js";
import { getCoaches } from "../../helpers/db.js";
import Stripe from "stripe";
import {methods as authorization} from "../../middlewares/authorization.js";
import path from 'path';
import {fileURLToPath} from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import revisarCookie2 from "../../helpers/revisarCookie2.js";
import multer from 'multer';
const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);



router.get("/create-student",authorization.soloPublico, (req,res)=> res.render(__dirname + "/pages/registerStudent.ejs"));
router.post('/api/updateUserCoach',authorization.soloStudents, (req, res) => updateStudentsCoach(req, res))

router.post('/create-checkout-session-student', createSession)
router.get('/create-student/success/:id', async (req, res) => {
    const students = await getInProgressStudents()

    for (const student of students) {
        const session = await stripe.checkout.sessions.retrieve(student.sessionId);
       // console.log(session)
        if(session.payment_status === 'paid'){ await updateStudentState(student.id) }
    }
    deleteUnpaidStudents();
    const student = await getStudentById(req.params.id)
    if (student){
      student.paid === 1 ? res.render(__dirname + "/pages/success.ejs") : res.redirect(`/create-student/cancel/${req.params.id}`);
    } else {
      res.redirect(`/create-student/cancel/${req.params.id}`);
      console.log("not found")
    }
}
)

router.get('/create-student/cancel/:id', async (req, res) => {
    const studentId = req.params.id; // Get student ID from the query parameter
    // Call the deleteUser function with the student ID
    const deletionResult = await deleteUser(studentId);
    if (deletionResult.success) {
        res.render(__dirname + "/pages/cancel.ejs");
      } else {
        res.render(__dirname + "/pages/cancel.ejs");
        console.log("not found")
      }
  });

  router.get("/students",authorization.soloStudents,(req,res)=> res.render(__dirname + "/pages/students/index.ejs"));

  router.get("/students/coaches",authorization.soloStudents, async function(req,res) { 
    const coaches = await getCoaches();
    const students = await getStudents();
    const studentId = revisarCookie2(req, students, "id");
    //console.log("id del st loged", studentId);
    const coachSelected = await getcoachSelected(studentId);
    //console.log(coachSelected);
    res.render(__dirname + "/pages/students/coaches.ejs", { coaches, coachSelected });
  });
  router.get("/students/mybills",authorization.soloStudents, async function(req,res) { 
    const students = await getStudents();
    const studentId = revisarCookie2(req, students, "id");
    const bills = await getBillById(studentId);
    console.log(bills)
    res.render(__dirname + "/pages/students/mybills.ejs", { bills });
  });
  router.get("/students/classes",authorization.soloStudents, async function(req,res) { 
    const students = await getStudents();
    const studentId = revisarCookie2(req, students, "id");
    const coachSelected = await getcoachSelected(studentId);
    const coachClasses = await getCoachClasses(coachSelected);
    res.render(__dirname + "/pages/students/classes.ejs", { coachClasses });
  });
  router.get("/students/classes/view/:id",authorization.soloStudents, async function(req,res) { 
    const students = await getStudents();
    const studentId = revisarCookie2(req, students, "id");
    const userAttendance = await logUserAttendance(req.params.id, studentId);
    const classSelected = await getClassById(req.params.id);
    //console.log("la traje",classSelected)
    res.render(__dirname + "/pages/students/verClase.ejs", { classSelected, userAttendance });
  });
 

  router.get("/students/account",authorization.soloStudents, async function(req,res) { 
    const students = await getStudents();
    const studentId = revisarCookie2(req, students, "id");
  try {
    const student = await getStudentById(studentId);
    res.render(__dirname + "/pages/students/account.ejs", { student });
  } catch (error) {
    console.error("Error al obtener datos del student:", error);
    res.redirect("/error");
    res.status(500).send("Error interno del servidor");
  }
  });
  const multerMiddleware = multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'public/imagenesStudents');
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
  router.post('/api/joinClass', (req, res) => joinClass(req, res));
  router.post('/api/leaveClass', (req, res) => leaveClass(req, res));
  router.post('/api/updatestudent', (req, res) => updateStudent(req, res));
  router.post('/api/uploadimagestudent', multerMiddleware.single('imagenstudent'), (req, res) => updateStudentImage(req, res));

  

 


export default router;