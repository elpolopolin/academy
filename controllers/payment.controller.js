import Stripe from "stripe"
import dotenv from "dotenv";
import { updateBillState, updateBillSession } from "../helpers/db.js";

dotenv.config();

//key of stripe account
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const createSession = async (req, res) => {
    try {
        // Create the session
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        product_data: {
                            name: "Polonsky Tennis Academy",
                            description: "Bill " + req.body.billId,
                        },
                        currency: "usd",
                        unit_amount: req.body.price * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `https://polonsky.relied.cloud//success/` + req.body.billId,
            cancel_url: "https://polonsky.relied.cloud//cancel",
            metadata: {
                billId: req.body.billId,
              },
        });


        await updateBillSession(req.body.billId, session.id)
        res.json(session);
    } catch (error) {
        console.error("Error en createSession:", error);
        return res.status(500).json({ error: "Error al procesar el pago." });
    }
};


