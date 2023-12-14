import { Router } from "express";
import express from "express";
import { createSession } from "../../controllers/payment.controller.js";
import { getAllbills, updateBillState } from "../../helpers/db.js";
import Stripe from "stripe";

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();

router.post('/create-checkout-session', createSession)
router.get('/success/:id', async (req, res) => {
    /*var charges = await stripe.charges.list({
        status: 'paid',
    });

    charges = charges.data
    console.log('paid', charges[1])*/

    var sessions = await stripe.checkout.sessions.list({
        limit: 3,
      });

    sessions = sessions.data
    console.log('sessions', sessions)
    
    const bills = await getAllbills()

    for (const bill of bills) {
        if (bill.paid === 0 && bill.sessionId !== null) {
            console.log('bill', bill)
            
            for (const session of sessions) {
                if (session.id === bill.sessionId && session.payment_status === 'paid') {
                    await updateBillState(bill.id)
                }
            }
        }
    }

    res.render("../pages/payment/success.ejs");
}
)
router.get('/cancel', (req, res) => res.render("../pages/payment/cancel.ejs"))

export default router;