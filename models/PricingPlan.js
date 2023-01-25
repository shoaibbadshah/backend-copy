const mongoose = require("mongoose");
const { Schema } = mongoose;

const PlanSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  benefits: {
    type: String,
    required: true,
  },
  rzpId: {
    type: String,
    required: true,
  },
  DateAdded: {
    type: String,
    default: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    required: true,
  },
});

const Plan = mongoose.model("plans", PlanSchema);
module.exports = Plan;
