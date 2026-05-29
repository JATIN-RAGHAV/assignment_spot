import express from "express";
import { orderStates, type createOrderResponse, type placeOrder } from "./types";
import { makeOrder } from "./logic";

const app = express();

app.post("/api/orders",(req,res) => {
    const order = req.body as placeOrder;

    const orderId = crypto.randomUUID();

    const matchReponse  = makeOrder(order,orderId);

    if(matchReponse.error){
        const response:createOrderResponse={
            orderId,
            status :orderStates.rejected,
            reason :matchReponse.message,
            fills : [],
            remainingQuantity : 0,
            cancelledQuantity : order.quantity,
            margin: {
                locked : 0,
                used : 0, 
                released : 0
            }
        }
        res.send(response)
        return;
    }

    /* Send the fills to position function */
    const positions = makePositions(matchReponse.fills);
    /* Get the udatedpositions and send them back to the user */
})

app.listen(3000);
