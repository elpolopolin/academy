import Stripe from "stripe"
import dotenv from "dotenv";
import { updateBillState, updateBillSession } from "../helpers/db.js";
import { updateStudentSession, getIdbyUsername } from "../helpers/studentDb.js";

dotenv.config();

//key of stripe account

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const createSession = async (req, res) => {
    console.log("esta es la sesion");
    const idUser = await getIdbyUsername(req.body.email)
    console.log("id del user para stripe", idUser);
    try {
        // Create the session
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        product_data: {
                            name: "Polonsky Tennis Academy",
                            description: "register student " + " " + req.body.email,
                        },
                        currency: "usd",
                        unit_amount: 25 * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `http://localhost:4000/create-student/success/` + idUser,
            cancel_url: "http://localhost:4000/create-student/cancel" + idUser,
            metadata: {
                idUser: idUser,
              },
        });

        console.log(session)
        await updateStudentSession(idUser, session.id)
        res.json(session);
    } catch (error) {
        console.error("Error en createSession:", error);
        return res.status(500).json({ error: "Error al procesar el pago." });
    }
};


