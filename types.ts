export interface user {
    availableBalance:number, 
    lockedMargin : number,
    /* Positions */
    realizedPnl : number,
    totalEquity : number,
    /* Key is the marketId */
    positions:Map<string,position>
}

export interface placeOrder {
    userId:
    string, symbol : string,
    side : string,
    type : string,
    price : number,
    quantity : number,
    leverage : number,
    postOnly
    : boolean,
    clientOrderId : string
}

export interface createOrderResponse {
    orderId :string,
    status :orderStates,
    reason :string,
    fills : fill[],
    remainingQuantity : number,
    cancelledQuantity : number,
    margin: {
        locked : number,
        used : number, 
        released : number
    }
}

export enum orderStates {
    resting = "resting",
    filled = "filled",
    partially_filled = "partially_filled",
    cancelled = "cancelled",
    rejected = "rejected"
}

export interface position{
    side:orderSide,
    quantity:number,
    price:number,
    liquidationPrice:number
}

export interface fills{
    totalQuantity:number,
    cancelledQuantity:number,
    fills:fill[]
}

export interface fill{
    price : number,
    quantity : number,
    makerOrderId :string
    makerUserId :string
    takerUserId :string
}

export interface minOrderResponse {
    fills:fills, 
    remainingQuantity : number,
    cancelledQuantity : number,
    margin : number,
    reason : string
}

export enum orderType {
    LIMIT = "LIMIT",
    MARKET = "MARKET"
}

export enum orderSide {
    LONG = "LONG",
    SHORT = "SHORT"
}

export type orderOnOrderbook =
{userId : string, orderId : string, quantity : number}

