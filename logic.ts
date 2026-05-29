import { orderSide, orderType, type fills, type placeOrder, type position, type user } from "./types";
import { setMarketPrice, USERS } from "./data";
import { ORDERBOOK } from "./data";

/* 
 * Should match order,
 * Find fills and update maker and taker's balances.
 * Also update the orderbook ofc.
 * Then return the fills. The fills then goto another function which handles
 * positions and finds the new positions.
*/

export const makeOrder = (order:placeOrder,orderId:string):{
    error:true,
    message:string
}|{
    error:false,
    fills:fills
}=> {
    const {userId,symbol,side,type,price,quantity,leverage,postOnly,clientOrderId} = order;

    /* Little input validation */
    if(side != orderSide.LONG && side != orderSide.SHORT){
        return{
            error:true,
            message:"invalid ordeside"
        }
    }

    /* Gotta check user balances first */
    let taker = USERS.get(userId);
    if(taker == undefined){
        return {
            error:true,
            message:"user not found"
        }
    }

    /* Validate balances */
    /* Price is alway present in both the cases, LIMIT OR Market */
    const balance = taker.availableBalance/leverage;
    const margin = (quantity*price)/leverage;
    if(balance < margin){
        return {
            error:true,
            message:"User doens't have enough funds"
        }
    }

    /* Lock */
    taker.availableBalance -= margin;
    taker.lockedMargin += margin;

    /* Make the fills by traversing orderbook. */
    const symbolOrderbook = ORDERBOOK.get(symbol);
    if(symbolOrderbook == undefined){
        return {
            error:true,
            message:"Market not found"
        }
    }

    let fills:fills= {
        totalQuantity:0,
        cancelledQuantity:0,
        fills:[]
    };

    const symbolOrderbookOppoSide = symbolOrderbook.get(side == orderSide.SHORT ? orderSide.LONG : orderSide.LONG);
    if(symbolOrderbookOppoSide == undefined){
        return {
            error:true,
            message:"Required orderbook side not found."
        }
    }

    /* Only run against the orderbook if not postonly */
    if(!postOnly){
        const keys =[... symbolOrderbookOppoSide.keys()];
        const sortedKeys = keys.sort((a,b) => {
            return side == orderSide.SHORT ?
                b-a:
                a-b;
        });

        let currentIndex = 0;
        let remQuantity = quantity;
        while(remQuantity > 0 && currentIndex < sortedKeys.length){
            const currentBestPrice = sortedKeys[currentIndex] as number;
            if(currentBestPrice>price){
                break;
            }

            const ordersAtcurrentBestPrice = symbolOrderbookOppoSide.get(currentBestPrice);
            if(ordersAtcurrentBestPrice == undefined)continue;

            for(const maker of ordersAtcurrentBestPrice.orders){
                const dealQuantity = Math.min(maker.quantity, remQuantity);

                /* Maker Id should be in User, but still just in case. */
                const makerData = USERS.get(maker.userId);
                if(makerData == undefined){
                    return{
                        error:true,
                        message:"Something went horrible,user exists on orderbook.But not on USERS"
                    }
                }
                /* Update Taker's balance */
                taker.lockedMargin -= dealQuantity*price;
                taker.availableBalance += dealQuantity*(price - currentBestPrice);
                /* Update Maker's balance */
                makerData.lockedMargin -= dealQuantity*price;
                /* Update orderbook */
                /* Incase of partial fill update price and for full fill delete order */
                ordersAtcurrentBestPrice.totalQuantity -= dealQuantity;
                if(dealQuantity <= maker.quantity){
                    /* This updates the actual quantity on the orderbook since it's an object */
                    maker.quantity -= dealQuantity;
                }else{
                    ordersAtcurrentBestPrice.orders.delete(maker);
                }

                /* Update remQuantity, fills and also the market price*/
                remQuantity -= dealQuantity;
                setMarketPrice(currentBestPrice);
                fills.fills.push({
                    price : currentBestPrice,
                    quantity : dealQuantity,
                    makerOrderId: maker.orderId,
                    makerUserId :maker.userId,
                    takerUserId :userId
                })

                if(remQuantity <= 0){
                    break;
                }
            }
        }
    }


    /* Add the rest on the orderbook. In case of LIMIT or PostOnly*/
    if(orderType.LIMIT == type || postOnly){
        const symbolOrderbookSameSide = symbolOrderbook.get(side);
        if(symbolOrderbookSameSide == undefined){
            return {
                error:true,
                message:`Some how orderbook for ${symbol} for ${side} doesnn't exist`
            }
        }

        let ordersAtPrice = symbolOrderbookSameSide.get(price);
        if(ordersAtPrice != undefined){
            ordersAtPrice.totalQuantity += quantity;
            ordersAtPrice.orders.add({
                userId,
                orderId,
                quantity 
            })
        }
    }

    /* Return the fills */
    fills.cancelledQuantity = quantity-fills.totalQuantity;
    return {
        error:false,
        fills:fills
    }
}

export const makePositions = (fills:fills,user:user,marketId:string,side:orderSide):boolean=> {
    const position = user.positions.get(marketId);
    /* If Position doens't exist then create it */
    if(position != undefined){
        /* Update Taker's position and then Maker's position. */
        if(position.side == side){
            let totalAmountUsed = 0;
            fills.fills.forEach(fill => {
                totalAmountUsed += fill.price;
            })
            const averagePrice = (totalAmountUsed + (position.price * position.quantity))/ (fills.totalQuantity + position.quantity);

            position.price = averagePrice;
            position.quantity = fills.totalQuantity + position.quantity;
        }else{
        }
    }
    /* Else update and find the new one with average price. */
    return true;
}
