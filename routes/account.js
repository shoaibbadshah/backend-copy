const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchUser");
const TradingAccount = require("../models/TradingAccount");
const Transaction = require("../models/Transaction");

router.post("/add", fetchUser, async (req, res) => {
  if (!req.body.name)
    return res
      .status(406)
      .json({ Error: "Please provide a valid account name" });

  try {
    let account = await TradingAccount.findOne({ name: req.body.name });
    if (account)
      return res.status(409).json({ Error: "Account already exists" });

    account = await TradingAccount.create({
      name: req.body.name,
      user: req.user.id,
    });

    return res.status(200).json(account);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.get("/get/:id", fetchUser, async (req, res) => {
  if (!req.params.id)
    return res.status(400).json({ Error: "Please provide a valid account id" });

  try {
    const account = await TradingAccount.findById(req.params.id).select("-__v");

    if (!account) return res.status(404).json({ Error: "Account not found" });

    if (account.user !== req.user.id)
      return res.status(401).json({ Error: "Unauthorized" });

    return res.status(200).json(account);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.get("/getall", fetchUser, async (req, res) => {
  try {
    const accounts = await TradingAccount.find({ user: req.user.id }).select(
      "-__v"
    );
    return res.status(200).json(accounts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.put("/update/:id", fetchUser, async (req, res) => {
  if (!req.params.id)
    return res.status(400).json({ Error: "Please provide a valid account id" });

  try {
    let account;
    try {
      account = await TradingAccount.findById(req.params.id);
    } catch {
      return res.status(404).json({ Error: "Account not found" });
    }

    if (!account) return res.status(404).json({ Error: "Account not found" });

    let updated = {};
    if (req.body.name) updated.name = req.body.name;

    account = await TradingAccount.findByIdAndUpdate(req.params.id, updated);
    account = await TradingAccount.findById(req.params.id);

    return res.status(200).json(account);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.delete("/delete/:id", fetchUser, async (req, res) => {
  if (!req.params.id)
    return res.status(400).json({ Error: "Please provide a valid account id" });

  try {
    let account;
    try {
      account = await TradingAccount.findById(req.params.id);
    } catch {
      return res.status(404).json({ Error: "Account not found" });
    }

    if (!account) return res.status(404).json({ Error: "Account not found" });

    // Deleting all the transaction for that account:
    await Transaction.deleteMany({
      user: req.user.id,
      account: account.id,
    });

    account = await TradingAccount.findByIdAndDelete(req.params.id);

    return res.status(200).json({ Success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

module.exports = router;
