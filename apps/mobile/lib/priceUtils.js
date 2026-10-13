"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateBill = calculateBill;
function calculateBill(params) {
    var dishPrice = params.dishPrice, quantity = params.quantity, sameSociety = params.sameSociety, deliveryMethod = params.deliveryMethod;
    var listPrice = dishPrice * quantity;
    var discount = sameSociety ? Math.round(listPrice * 0.1) : 0;
    var deliveryFee = deliveryMethod === 'PICKUP' ? 0 : (sameSociety ? 10 : 35);
    var totalPayable = listPrice - discount + deliveryFee;
    return {
        listPrice: listPrice,
        discount: discount,
        deliveryFee: deliveryFee,
        totalPayable: totalPayable,
    };
}
