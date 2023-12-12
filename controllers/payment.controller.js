import Stripe from "stripe"

//key of stripe account
const stripe = new Stripe('sk_test_51OMafjFUIUa6MISLznSqI87CMFxqw1nicGA1EdIqYwuL7zt8SHzUxZp4PEKQCX2S6GeLke52q8ajqUwk575vIS2k00kODSMDCH')

export const createSession = async (req, res) => {
    console.log(req.body)
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price_data: {
                    product_data: {
                        name: 'Polonsky Tennis Academy',
                        description: req.body.length + 'hr Class',
                    },
                    currency: 'usd',
                    unit_amount: (req.body.price * 100)
                },
                quantity: 1
            }
        ],
        mode: 'payment',
        success_url: 'http://localhost:4000/success',
        cancel_url: 'http://localhost:4000/cancel'
    })

    return res.json(session)
}