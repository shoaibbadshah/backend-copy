const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchUser");
const User = require("../models/User");
const axios = require("axios");
const Plan = require("../models/PricingPlan");
const geoIP = require("geoip-lite");

router.post("/add", fetchUser, async (req, res) => {
  const user = await User.findById(req.user.id).select("email");

  if (user.email !== process.env.ADMIN_EMAIL)
    return res.status(401).json({ Error: "Underprivileged User" });

  if (
    !req.body.name ||
    !typeof req.body.price === "number" ||
    !req.body.benefits
  )
    return res
      .status(406)
      .json({ Error: "Please provide a valid plan name, price, and benefits" });

  try {
    const geo = geoIP.lookup(req.ip);
    console.log(geo);

    let plan = await Plan.findOne({ name: req.body.name });
    if (plan) return res.status(409).json({ Error: "Plan already exists" });

    const rzpPlan = await axios
      .post(
        "https://api.razorpay.com/v1/plans",
        {
          period: "yearly",
          interval: 12,
          item: {
            name: req.body.name,
            amount: req.body.price * 100,
            currency: "INR",
            description: req.body.benefits,
          },
        },

        {
          headers: {
            Authorization:
              "Basic cnpwX3Rlc3RfYm5KTGZyZHl2Y0lXbXA6U3ZFU3AxTE1uQXBQOG55akJqMlVoTmRH",
          },
        }
      )
      .then((response) => response.data);

    plan = await Plan.create({
      name: req.body.name,
      price: Number(req.body.price),
      benefits: req.body.benefits,
      rzpId: rzpPlan.id,
    });

    return res.status(200).json({ Success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json("Internal Server Error");
  }
});

router.get("/get/:planId", async (req, res) => {
  if (!req.params.planId)
    return res.status(406).json({ Error: "Please provide a valid Plan ID" });
  try {
    const plan = await Plan.findById(req.params.planId).select("-__v");

    if (!plan) return res.status(404).json({ Error: "Plan not found" });
    return res.status(200).json(plan);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.get("/getall", fetchUser, async (req, res) => {
  try {
    const plans = await Plan.find().select("-__v");
    return res.status(200).json(plans);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.put("/update", fetchUser, async (req, res) => {
  const user = await User.findById(req.user.id).select("email");

  if (user.email !== process.env.ADMIN_EMAIL)
    return res.status(401).json({ Error: "Underprivileged User" });

  if (
    !req.body.planId ||
    (!req.body.name && !req.body.price && !req.body.benefits) ||
    (req.body.price && typeof req.body.price !== "number")
  )
    return res.status(406).json({ Error: "Please provide a valid update" });

  try {
    let plan;
    try {
      plan = await Plan.findById(req.body.planId);
    } catch {
      return res.status(404).json({ Error: "Plan not found" });
    }

    if (!plan) return res.status(404).json({ Error: "Plan not found" });

    let updated = {};
    if (req.body.name) {
      updated.name = req.body.name;
      rzp.name = req.body.name;
    }
    if (req.body.price) {
      updated.price = Number(req.body.price);
      rzp.price = Number(req.body.price) * 100;
    }
    if (req.body.benefits) {
      updated.benefits = req.body.benefits;
      rzp.description = req.body.benefits;
    }

    const rzpPlan = await axios
      .post(
        "https://api.razorpay.com/v1/plans",
        {
          period: "yearly",
          interval: 12,
          item: {
            ...rzp,
            currency: "INR",
          },
        },

        {
          headers: {
            Authorization:
              "Basic cnpwX3Rlc3RfYm5KTGZyZHl2Y0lXbXA6U3ZFU3AxTE1uQXBQOG55akJqMlVoTmRH",
          },
        }
      )
      .then((response) => response.data);

    updated.rzpId = await rzpPlan.id;

    await axios
      .get("https://api.razorpay.com/v1/subscriptions", {
        headers: {
          Authorization:
            "Basic cnpwX3Rlc3RfYm5KTGZyZHl2Y0lXbXA6U3ZFU3AxTE1uQXBQOG55akJqMlVoTmRH",
        },
      })
      .then((response) => {
        for (let item of response.items) {
          axios.patch(`https://api.razorpay.com/v1/subscriptions/${item.id}`, {
            plan_id: updated.rzpId,
          });
        }
      }),
      (plan = await Plan.findByIdAndUpdate(req.body.planId, updated));
    plan = await Plan.findById(req.body.planId);

    return res.status(200).json(plan);
  } catch (err) {
    console.error(err);
    return res.status(500).json("Internal Server Error");
  }
});

// router.delete("/delete", fetchUser, async (req, res) => {
//   const user = await User.findById(req.user.id).select("email");

//   if (user.email !== process.env.ADMIN_EMAIL)
//     return res.status(401).json({ Error: "Underprivileged User" });

//   if (!req.body.planId)
//     return res.status(406).json({ Error: "Please provide a valid plan id" });

//   try {
//     let plan;
//     try {
//       plan = await Plan.findById(req.body.planId);
//     } catch {
//       return res.status(404).json({ Error: "Plan not found" });
//     }

//     if (!plan) return res.status(404).json({ Error: "Plan not found" });

//     plan = await Plan.findByIdAndDelete(req.body.planId);

//     return res.status(200).json({ Success: true });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json("Internal Server Error");
//   }
// });

module.exports = router;
