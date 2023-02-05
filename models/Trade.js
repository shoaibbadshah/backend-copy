const mongoose = require("mongoose");
const { Schema } = mongoose;

const TradeSchema = new Schema({
  account: {
    type: String,
    required: true,
  },
  tradeSide: {
    type: String, // Buy/Sell
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  symbol: {
    type: String,
    required: true,
  },
  marketSegment: {
    type: String, // Stock/Futures/Options/CFD/Forex
    required: true,
  },
  entryPrice: {
    type: Number,
    required: true,
  },
  tradeType: {
    type: String, // Intraday/Swing/Positional
    required: true,
  },
  entryDate: {
    type: String,
    required: true,
  },
  exitDate: {
    type: String,
  },
  exitPrice: {
    type: Number,
  },
  brokerage: {
    type: Number,
  },
  earning: {
    type: Number,
  },
  DateAdded: {
    type: String,
    default: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    required: true,
  },
});

const Trade = mongoose.model("Trades", TradeSchema);
module.exports = Trade;
