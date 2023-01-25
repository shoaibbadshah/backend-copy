const express = require("express");
const router = express.Router();
const axios = require("axios");
const Razorpay = require("razorpay");
const fetchUser = require("../middleware/fetchUser");
const User = require("../models/User");

let response;

const razorpay = new Razorpay({
  key_id: "rzp_test_bnJLfrdyvcIWmp",
  key_secret: "SvESp1LMnApP8nyjBj2UhNdG",
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

    const amount = plan.price;
    const payment_capture = 1;
    const currency = "INR";
    // const options = {
    //   amount: amount * 100,
    //   receipt: user.email,
    //   handler: (response) => console.log(response),
    //   currency,
    //   payment_capture,
    // };
    // response = await razorpay.orders.create(options);

    const options = {
      period: "weekly",
      interval: 1,
      item: {
        name: "Test plan - Weekly",
        amount: 69900,
        currency: "INR",
        description: "Description for the test plan",
      },
      notes: {
        notes_key_1: "Tea, Earl Grey, Hot",
        notes_key_2: "Tea, Earl Grey… decaf.",
      },
      // period: "yearly",
      // interval: 12,
      // item: {
      //   name: plan.name,
      //   amount: amount * 100,
      //   currency,
      // },
      // handler: (response) => console.log(response),
    };
    try {
      response = await razorpay.plans.create(options);
    } catch (err) {
      console.error(err);
    }

    return res.status(200).json({
      response,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ Error: "Internal Server Error" });
  }
});
module.exports = router;
