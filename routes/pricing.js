const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchUser");
const User = require("../models/User");
const axios = require("axios");
const Plan = require("../models/PricingPlan");
const PayPalSubscription = require("../models/PayPalSubscription");

require("dotenv").config();

// Create Product in PayPal
const createProduct = async () => {
  const product = await axios
    .post(
      `https://api-m.sandbox.paypal.com/v1/catalogs/products`,
      {
        name: "Subscriptions Model",
        type: "SERVICE",
        id: "subscriptionModel",
      },
      {
        headers: {
          Authorization:
            "Basic QVZpTnQyS0FCUTBkeFAtZHZNUmVIRkkxWGlHcWpSeGFLTURKcEpOeGJ3dGNXYlpRczdXb0U4MkZQb3hVYm1YVzVxb3hOc2V0Q0E5WWN0cU06RVB4ektRLTZzQ2VXWVRIc3FmMU4tZzFoNFZvcVhMYmZOZmpLcUt1Nk5yUEdhb0dBa2ZaX3FMQWZRV0lIRXh2Rm56YXN3Nlg5V1lMV2dyb0s=",
        },
      }
    )
    .then((response) => response.data)
    .catch((err) => console.error(err));

  return product;
};

router.post("/add", fetchUser, async (req, res) => {
  const user = await User.findById(req.user.id).select("email");

  if (user.email !== process.env.ADMIN_EMAIL)
    return res.status(401).json({ Error: "Underprivileged User" });

  if (
    !req.body.name ||
    !typeof req.body.price === "number" ||
    !typeof req.body.INRPrice === "number" ||
    !req.body.benefits
  )
    return res
      .status(406)
      .json({ Error: "Please provide a valid plan name, price, and benefits" });

  try {
    let plan = await Plan.findOne({ name: req.body.name });
    if (plan) return res.status(409).json({ Error: "Plan already exists" });

    // Creating Razorpay Plan
    const rzpPlan = await axios
      .post(
        "https://api.razorpay.com/v1/plans",
        {
          period: "yearly",
          interval: 1,
          item: {
            name: req.body.name,
            amount: Number(req.body.INRPrice) * 100,
            currency: "INR",
            description: req.body.benefits,
          },
        },

        {
          headers: {
            Authorization: process.env.RAZORPAY_AUTH_TOKEN,
          },
        }
      )
      .then((response) => response.data)
      .catch((err) => err);

    // Creating a product in PayPal if it doesn't exist
    const pplProducts = await axios
      .get(
        `https://api-m.sandbox.paypal.com/v1/catalogs/products?page_size=10&page=1&total_required=true`,
        {
          headers: {
            Authorization:
              "Basic QVZpTnQyS0FCUTBkeFAtZHZNUmVIRkkxWGlHcWpSeGFLTURKcEpOeGJ3dGNXYlpRczdXb0U4MkZQb3hVYm1YVzVxb3hOc2V0Q0E5WWN0cU06RVB4ektRLTZzQ2VXWVRIc3FmMU4tZzFoNFZvcVhMYmZOZmpLcUt1Nk5yUEdhb0dBa2ZaX3FMQWZRV0lIRXh2Rm56YXN3Nlg5V1lMV2dyb0s=",
          },
        }
      )
      .then((response) => response.data)
      .catch((err) => console.error(err));

    let productIDs = [];
    for (let product of pplProducts.products) {
      productIDs.push(product.id);
    }
    if (!productIDs.includes("subscriptionModel")) await createProduct();

    // Creating Plan in PayPal
    const pplPlan = await axios
      .post(
        "https://api-m.sandbox.paypal.com/v1/billing/plans",
        {
          product_id: "subscriptionModel",
          name: req.body.name,
          description: req.body.benefits,
          status: "ACTIVE",
          billing_cycles: [
            {
              frequency: {
                interval_unit: "YEAR",
                interval_count: 1,
              },
              tenure_type: "REGULAR",
              sequence: 1,
              total_cycles: 0,
              pricing_scheme: {
                fixed_price: {
                  value: req.body.price.toString(),
                  currency_code: "USD",
                },
              },
            },
          ],
          payment_preferences: {
            auto_bill_outstanding: true,
            setup_fee_failure_action: "CONTINUE",
            payment_failure_threshold: 3,
          },
        },

        {
          headers: {
            Authorization:
              "Basic QVZpTnQyS0FCUTBkeFAtZHZNUmVIRkkxWGlHcWpSeGFLTURKcEpOeGJ3dGNXYlpRczdXb0U4MkZQb3hVYm1YVzVxb3hOc2V0Q0E5WWN0cU06RVB4ektRLTZzQ2VXWVRIc3FmMU4tZzFoNFZvcVhMYmZOZmpLcUt1Nk5yUEdhb0dBa2ZaX3FMQWZRV0lIRXh2Rm56YXN3Nlg5V1lMV2dyb0s=",
          },
        }
      )
      .then((response) => response.data)
      .catch((err) => err);

    plan = await Plan.create({
      name: req.body.name,
      price: Number(req.body.price),
      INRPrice: Number(req.body.INRPrice),
      benefits: req.body.benefits,
      rzpId: rzpPlan.id,
      pplId: pplPlan.id,
    });

    return res.status(201).json({ Success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
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
    (!req.body.name &&
      !req.body.price &&
      !req.body.INRPrice &&
      !req.body.benefits) ||
    (req.body.price && typeof req.body.price !== "number") ||
    (req.body.INRPrice && typeof req.body.INRPrice !== "number")
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
    let rzp = {};
    let ppl = {};

    if (req.body.name) {
      updated.name = req.body.name;
      rzp.name = req.body.name;
      ppl.name = req.body.name;
    }
    if (req.body.INRPrice) {
      updated.INRPrice = Number(req.body.INRPrice);
      rzp.amount = Number(req.body.INRPrice) * 100;
    }
    if (req.body.price) {
      updated.price = Number(req.body.price);
      ppl.price = Number(req.body.price) * 100;
    }
    if (req.body.benefits) {
      updated.benefits = req.body.benefits;
      rzp.description = req.body.benefits;
      ppl.description = req.body.benefits;
    }

    const rzpPlan = await axios
      .post(
        "https://api.razorpay.com/v1/plans",
        {
          period: "yearly",
          interval: 1,
          item: {
            ...rzp,
            currency: "INR",
          },
        },

        {
          headers: {
            Authorization: process.env.RAZORPAY_AUTH_TOKEN,
          },
        }
      )
      .then((response) => response.data)
      .catch((err) => console.error(err));

    updated.rzpId = await rzpPlan.id;

    await axios
      .get("https://api.razorpay.com/v1/subscriptions", {
        headers: {
          Authorization: process.env.RAZORPAY_AUTH_TOKEN,
        },
      })
      .then((response) => {
        for (let item of response.data.items) {
          axios
            .patch(
              `https://api.razorpay.com/v1/subscriptions/${item.id}`,
              {
                plan_id: updated.rzpId,
              },
              {
                headers: {
                  Authorization: process.env.RAZORPAY_AUTH_TOKEN,
                },
              }
            )
            .catch((err) => err);
        }
      });

    const pplPlan = await axios
      .post(
        "https://api-m.sandbox.paypal.com/v1/billing/plans",
        {
          product_id: "subscriptionModel",
          name: req.body.name,
          description: req.body.benefits,
          status: "ACTIVE",
          billing_cycles: [
            {
              frequency: {
                interval_unit: "YEAR",
                interval_count: 1,
              },
              tenure_type: "REGULAR",
              sequence: 1,
              total_cycles: 0,
              pricing_scheme: {
                fixed_price: {
                  value: req.body.price.toString(),
                  currency_code: "USD",
                },
              },
            },
          ],
          payment_preferences: {
            auto_bill_outstanding: true,
            setup_fee_failure_action: "CONTINUE",
            payment_failure_threshold: 3,
          },
        },

        {
          headers: {
            Authorization: process.env.PAYPAL_AUTH_TOKEN,
          },
        }
      )
      .then((response) => response.data)
      .catch((err) => console.error(err));

    updated.pplId = await pplPlan.id;

    let subs = await PayPalSubscription.find({ planId: plan.pplId }).select(
      "subId"
    );

    // Revising subscriptions in PayPal
    for (let subId of subs) {
      axios
        .post(
          `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subId}/revise`,
          {
            plan_id: updated.pplId,
          },
          {
            headers: {
              Authorization: process.env.PAYPAL_AUTH_TOKEN,
            },
          }
        )
        .catch((err) => err);
    }

    subs = await PayPalSubscription.updateMany(
      { planId: plan.pplId },
      { $set: { planId: updated.pplId } }
    );

    plan = await Plan.findByIdAndUpdate(req.body.planId, updated);
    plan = await Plan.findById(req.body.planId);

    return res.status(200).json(plan);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
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
//     return res.status(500).json({Error: "Internal Server Error"});
//   }
// });

module.exports = router;
