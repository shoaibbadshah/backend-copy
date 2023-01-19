const mongoose = require("mongoose");
const { Schema } = mongoose;

const FAQSchema = new Schema({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  DateAdded: {
    type: String,
    default: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    required: true,
  },
});

const FAQ = mongoose.model("FAQ", FAQSchema);
module.exports = FAQ;
