const mongoose = require("mongoose");
const { Schema } = mongoose;

const TradingAccountSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  user: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  trades: {
    type: Number,
    default: 0,
  },
  DateAdded: {
    type: String,
    default: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    required: true,
  },
});

const TradingAccount = mongoose.model("TradingAccounts", TradingAccountSchema);
module.exports = TradingAccount;
