const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchUser");
const Transaction = require("../models/Transaction");
const TradingAccount = require("../models/TradingAccount");

router.post("/add", fetchUser, async (req, res) => {
  if (!req.body.type || !req.body.date || !req.body.value || !req.body.account)
    return res
      .status(406)
      .json({ Error: "Please provide all the transaction details" });

  if (
    req.body.type !== "Withdrawal" &&
    req.body.type !== "Deposit" &&
    req.body.type !== "Dividends" &&
    req.body.type !== "Taxes" &&
    req.body.type !== "Fees"
  )
    return res
      .status(406)
      .json({ Error: "Please provide a valid transaction type" });

  if (isNaN(req.body.value))
    return res
      .status(400)
      .json({ Error: "Please provide an integer transaction value" });

  try {
    const account = await TradingAccount.findById(req.body.account).select(
      "user"
    );

    if (!account)
      return res
        .status(400)
        .json({ Error: "Please provide a valid account id" });

    if (account.user !== req.user.id)
      return res.status(401).json({ Error: "Account not owned by the user" });

    const transaction = await Transaction.create({
      type: req.body.type,
      date: req.body.date,
      value: Number(req.body.value),
      account: req.body.account,
      user: req.user.id,
    });

    return res.status(201).json(transaction);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.get("/getall/:account", fetchUser, async (req, res) => {
  if (!req.params.account)
    return res.status(400).json({ Error: "Please provide a valid account id" });

  try {
    let account;
    try {
      account = await TradingAccount.findById(req.params.account).select(
        "user"
      );
    } catch (err) {
      return res.status(404).json({ Error: "Account not found" });
    }

    if (account.user !== req.user.id)
      return res.status(401).json({ Error: "Account not owned by the user" });

    const transactions = await Transaction.find({
      user: req.user.id,
      account: req.params.account,
    }).select("-__v");

    return res.status(200).json(transactions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.put("/update/:id", fetchUser, async (req, res) => {
  if (!req.params.id)
    return res
      .status(400)
      .json({ Error: "Please provide a valid transaction id" });

  if (req.body.value && isNaN(req.body.value))
    return res
      .status(400)
      .json({ Error: "Please provide a valid transaction value" });

  if (req.body.type) {
    if (
      req.body.type !== "Withdrawal" &&
      req.body.type !== "Deposit" &&
      req.body.type !== "Dividends" &&
      req.body.type !== "Taxes" &&
      req.body.type !== "Fees"
    )
      return res
        .status(406)
        .json({ Error: "Please provide a valid transaction type" });
  }

  try {
    // Checking for the user's trading account:
    const account = await TradingAccount.findById(req.body.account).select(
      "user"
    );

    if (!account)
      return res
        .status(400)
        .json({ Error: "Please provide a valid account id" });

    if (account.user !== req.user.id)
      return res.status(401).json({ Error: "Account not owned by the user" });

    // Updating the transaction:
    let transaction;
    try {
      transaction = await Transaction.findById(req.params.id);
    } catch {
      return res.status(404).json({ Error: "Transaction not found" });
    }

    if (!transaction)
      return res.status(404).json({ Error: "Transaction not found" });

    let updated = {};
    if (req.body.type) updated.type = req.body.type;
    if (req.body.value) updated.value = req.body.value;
    if (req.body.date) updated.date = req.body.date;

    transaction = await Transaction.findByIdAndUpdate(req.params.id, updated);
    transaction = await Transaction.findById(req.params.id);

    return res.status(200).json(transaction);
  } catch (err) {
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.delete("/delete/:account/:id", fetchUser, async (req, res) => {
  if (!req.params.account)
    return res
      .status(400)
      .json({ Error: "Please provide a valid trading account" });
  if (!req.params.id)
    return res
      .status(400)
      .json({ Error: "Please provide a valid transaction id" });

  try {
    // Trading Account validation:
    const account = await TradingAccount.findById(req.params.account).select(
      "user"
    );

    if (!account)
      return res
        .status(400)
        .json({ Error: "Please provide a valid account id" });

    if (account.user !== req.user.id)
      return res.status(401).json({ Error: "Account not owned by the user" });

    // Deleting the transaction:
    let transaction;
    try {
      transaction = await Transaction.findById(req.params.id);
    } catch {
      return res.status(404).json({ Error: "Transaction not found" });
    }

    if (!transaction)
      return res.status(404).json({ Error: "Transaction not found" });

    transaction = await Transaction.findByIdAndDelete(req.params.id);

    return res.status(200).json({ Success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

module.exports = router;
