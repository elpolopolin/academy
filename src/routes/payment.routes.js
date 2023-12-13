import { Router } from "express";
import { createSession } from "../../controllers/payment.controller.js";
import { updateBill } from "../../helpers/db.js";

const router = Router()

router.post('/create-checkout-session', createSession)
router.get('/success/:id', async (req, res) => {
    let bill = await updateBill(req.params.id)
    res.render("../pages/payment/success.ejs");
}
)
router.get('/cancel', (req, res) => res.render("../pages/payment/cancel.ejs"))

export default router;