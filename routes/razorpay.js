const express = require("express");
const router = express.Router();
const axios = require("axios");
const Razorpay = require("razorpay");
const fetchUser = require("../middleware/fetchUser");
const User = require("../models/User");

let response;

const razorpay = new Razorpay({
  key_id: process.env.RZP_KEY_ID,
  key_secret: process.env.RZP_KEY_SECRET,
});

router.post("/", fetchUser, async (req, res) => {
  if (!req.body.planId)
    return res.status(406).json({ Error: "Please provide a valid Plan ID" });

  try {
    const user = await User.findById(req.user.id).select("email");
    let plan;

    plan = await axios
      .get(`http://localhost:5000/api/pricing/get/${req.body.planId}`)
      .then((response) => response.data);

    if (!plan) {
      res.status(404).json({ Error: "Plan not found" });
      return;
    }

    let expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear + 1);

    const options = {
      plan_id: plan.rzpId,
      quantity: 1,
      total_count: 1,
      customer_notify: 1,
    };
    try {
      response = await razorpay.subscriptions.create(options);
    } catch (err) {
      console.error(err);
    }

    return res.status(201).json({
      response,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ Error: "Internal Server Error" });
  }
});
module.exports = router;
