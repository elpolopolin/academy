import { Router } from "express";
import express from "express";
import { createSession } from "../../controllers/payment.controller.js";
import { getAllbills, updateBillState, getInProgressBills, getBillById } from "../../helpers/db.js";
import Stripe from "stripe";

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();

router.post('/create-checkout-session', createSession)
router.get('/success/:id', async (req, res) => {

    /*var sessions = await stripe.checkout.sessions.list({
        limit: 3,
      });

    sessions = sessions.data*/
    
    const bills = await getInProgressBills()

    for (const bill of bills) {
        /*for (const session of sessions) {
            if (session.id === bill.sessionId && session.payment_status === 'paid') {
                await updateBillState(bill.id)
            }
        }*/
        const session = await stripe.checkout.sessions.retrieve(bill.sessionId);
        console.log("ESTA ES LA SESION", session)
        if(session.payment_status === 'paid'){ await updateBillState(bill.id) }
    }

    const bill = await getBillById(req.params.id)
    bill.paid === 1 ? res.render("../pages/payment/success.ejs") : res.redirect('/cancel')
    
    
}
)
router.get('/cancel', (req, res) => res.render("../pages/payment/cancel.ejs"))

export default router;