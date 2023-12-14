import Stripe from "stripe"
import dotenv from "dotenv";

dotenv.config();
//key of stripe account
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const createSession = async (req, res) => {
    console.log(req.body)
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price_data: {
                    product_data: {
                        name: 'Polonsky Tennis Academy',
                        description: req.body.billId + '',
                    },
                    currency: 'usd',
                    unit_amount: (req.body.price * 100)
                },
                quantity: 1
            }
        ],
        mode: 'payment',
        success_url: 'http://localhost:4000/success/' + req.body.billId,
        cancel_url: 'http://localhost:4000/cancel'
    })

    return res.json(session)
}