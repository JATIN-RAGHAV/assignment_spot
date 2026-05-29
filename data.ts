import type { orderOnOrderbook, orderSide, position, user } from "./types";

export let users = new Map<string,user>();

/* OB.BTC.LONG.10[]  this gives a map of orders,price is the kye */
export const ORDERBOOK = new Map<
    string,
    Map<orderSide,
        Map<number, {totalQuantity : number, orders : Set<orderOnOrderbook>}>>>();

/* Key is the user Id */
export const USERS = new Map<string,user>();

/* Global Positions */
export const POSITIONS = new Map<orderSide,position[]>();

let marketPrice = 0;

export const getMarketPrice = () => {
    return marketPrice;
}

export const setMarketPrice = (price:number) => {
    marketPrice = price;
}
