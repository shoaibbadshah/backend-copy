const mongoose = require("mongoose");
const { Schema } = mongoose;

const TransactionSchema = new Schema({
  type: {
    type: String, // Withdrawal, Deposit, Dividends, Taxes, Fees
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  account: {
    type: String,
    required: true,
  },
  user: {
    type: String,
    required: true,
  },
  DateAdded: {
    type: String,
    default: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    required: true,
  },
});

const Transaction = mongoose.model("Transactions", TransactionSchema);
module.exports = Transaction;
