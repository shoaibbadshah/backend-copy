const mongoose = require("mongoose");
const { Schema } = mongoose;

const PayPalSubscriptionSchema = new Schema({
  planId: { type: String, required: true },
  subId: { type: String, required: true },
  DateAdded: {
    type: String,
    default: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    required: true,
  },
});

const PayPalSubscription = mongoose.model(
  "PayPalSubscription",
  PayPalSubscriptionSchema
);
module.exports = PayPalSubscription;
