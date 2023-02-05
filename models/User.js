const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  accountType: {
    type: String,
    default: "Free",
  },
  pplSubID: {
    type: String,
    default: "",
  },
  rzpSubID: {
    type: String,
    default: "",
  },
  DateAdded: {
    type: String,
    default: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    required: true,
  },
});

const User = mongoose.model("users", UserSchema);
module.exports = User;
