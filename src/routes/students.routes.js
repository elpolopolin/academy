import { Router } from "express";
import express from "express";
import { createSession } from "../../controllers/paymentStudent.js";
import { getInProgressStudents, updateStudentState, getStudentById, deleteUnpaidStudents, deleteUser, getStudents, getcoachSelected, updateStudentsCoach } from "../../helpers/studentDb.js";
import { getCoaches } from "../../helpers/db.js";
import Stripe from "stripe";
import {methods as authorization} from "../../middlewares/authorization.js";
import path from 'path';
import {fileURLToPath} from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import revisarCookie2 from "../../helpers/revisarCookie2.js";

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();

router.get("/create-student",authorization.soloPublico, (req,res)=> res.render(__dirname + "/pages/registerStudent.ejs"));
router.post('/api/updateUserCoach',authorization.soloStudents, (req, res) => updateStudentsCoach(req, res))

router.post('/create-checkout-session-student', createSession)
router.get('/create-student/success/:id', async (req, res) => {
    const students = await getInProgressStudents()

    for (const student of students) {
        const session = await stripe.checkout.sessions.retrieve(student.sessionid);
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

 


export default router;