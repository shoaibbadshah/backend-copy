const express = require("express");
const router = express.Router();
const axios = require("axios");
const fetchUser = require("../middleware/fetchUser");
const User = require("../models/User");
const PayPalSubscription = require("../models/PayPalSubscription");

let response;

router.post("/", fetchUser, async (req, res) => {
  if (!req.body.planId)
    return res.status(406).json({ Error: "Please provide a valid Plan ID" });

  try {
    let user = await User.findById(req.user.id).select("email");
    let plan;

    plan = await axios
      .get(`http://localhost:5000/api/pricing/get/${req.body.planId}`)
      .then((response) => response.data);

    if (!plan) {
      res.status(404).json({ Error: "Plan not found" });
      return;
    }

    try {
      response = await axios
        .post(
          `https://api-m.sandbox.paypal.com/v1/billing/subscriptions`,
          { plan_id: plan.pplId },
          {
            headers: { Authorization: process.env.PAYPAL_AUTH_TOKEN },
          }
        )
        .then((response) => response.data)
        .catch((err) => console.error(err));
    } catch (err) {
      console.error(err);
    }

    user = await User.findByIdAndUpdate(user.id, {
      $set: { pplSubID: response.id },
    });

    await PayPalSubscription.create({
      planId: plan.pplId,
      subId: response.id,
    });

    return res.status(201).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ Error: "Internal Server Error" });
  }
});
module.exports = router;
