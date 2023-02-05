const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchUser");
const Trade = require("../models/Trade");
const TradingAccount = require("../models/TradingAccount");

router.post("/add", fetchUser, async (req, res) => {
  if (
    !req.body.account ||
    !req.body.tradeSide ||
    !req.body.quantity ||
    !req.body.symbol ||
    !req.body.marketSegment ||
    !req.body.entryPrice ||
    !req.body.tradeType ||
    !req.body.entryDate
  )
    return res
      .status(406)
      .json({ Error: "Please provide all the required trade details" });

  // Qty. & Entry Price Validation:
  if (isNaN(req.body.quantity) || isNaN(req.body.entryPrice))
    return res.status(400).json({
      Error: "Please provide a valid numerical quantity and entry price",
    });

  if (
    req.body.exitDate ||
    req.body.exitPrice ||
    req.body.brokerage ||
    req.body.earning
  )
    if (
      isNaN(req.body.exitPrice) ||
      isNaN(req.body.brokerage) ||
      isNaN(req.body.earning)
    )
      // Exit Price, Brokerage, & Earning(P&L) Validation:
      return res.status(400).json({
        Error:
          "Please provide valid numerical exit price, brokerage, and earning",
      });

  //   Trade Side Validation
  if (req.body.tradeSide !== "Buy" && req.body.tradeSide !== "Sell")
    return res.status(400).json({ Error: "Please provide a valid trade side" });

  // Market Segment Validation:
  if (
    req.body.marketSegment !== "Stock" &&
    req.body.marketSegment !== "Futures" &&
    req.body.marketSegment !== "Options" &&
    req.body.marketSegment !== "CFD" &&
    req.body.marketSegment !== "Forex"
  )
    return res
      .status(400)
      .json({ Error: "Please provide a valid market segment" });

  // Trade Type Validation
  if (
    req.body.tradeType !== "Intraday" &&
    req.body.tradeType !== "Swing" &&
    req.body.tradeType !== "Positional"
  )
    return res.status(400).json({ Error: "Please provide a valid trade type" });

  // Creating the trade if everything is alright:
  try {
    // Validating Trading Account's ownership of the user:
    const account = await TradingAccount.findById(req.body.account).select(
      "user"
    );

    if (!account)
      return res
        .status(400)
        .json({ Error: "Please provide a valid account id" });

    if (account.user !== req.user.id)
      return res.status(401).json({ Error: "Account not owned by the user" });

    let tradeOptions = {
      account: req.body.account,
      tradeSide: req.body.tradeSide,
      quantity: Number(req.body.quantity),
      symbol: req.body.symbol,
      marketSegment: req.body.marketSegment,
      entryPrice: Number(req.body.entryPrice),
      tradeType: req.body.tradeType,
      entryDate: req.body.entryDate,
    };

    if (
      req.body.exitDate &&
      req.body.exitPrice &&
      req.body.brokerage &&
      req.body.earning
    ) {
      tradeOptions.exitDate = req.body.exitDate;
      tradeOptions.exitPrice = Number(req.body.exitPrice);
      tradeOptions.brokerage = Number(req.body.brokerage);
      tradeOptions.earning = Number(req.body.earning);
    }

    //   Creating the trade:
    const trade = await Trade.create(tradeOptions);

    return res.status(201).json(trade);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.get("/get/:account/:id", fetchUser, async (req, res) => {
  if (!req.params.id || !req.params.account)
    return res
      .status(400)
      .json({ Error: "Please provide valid trade & account id" });

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

    const trade = await Trade.findById(req.params.id).select("-__v");
    if (!trade) return res.status(404).json({ Error: "Trade not found" });

    return res.status(200).json(trade);
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

    const trades = await Trade.find({
      user: req.user.id,
      account: req.params.account,
    }).select("-__v");

    return res.status(200).json(trades);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.put("/update/:id", fetchUser, async (req, res) => {
  if (!req.params.id)
    return res.status(400).json({ Error: "Please provide valid trade id" });

  if (req.body.quantity && isNaN(req.body.quantity)) {
    return res
      .status(400)
      .json({ Error: "Please provide a valid numerical quantity" });
  }

  if (req.body.entryPrice && isNaN(req.body.entryPrice)) {
    return res
      .status(400)
      .json({ Error: "Please provide a valid numerical entry price" });
  }

  if (req.body.exitPrice && isNaN(req.body.exitPrice)) {
    return res
      .status(400)
      .json({ Error: "Please provide a valid numerical exit price" });
  }

  if (req.body.brokerage && isNaN(req.body.brokerage)) {
    return res
      .status(400)
      .json({ Error: "Please provide a valid numerical brokerage" });
  }

  if (req.body.earning && isNaN(req.body.earning)) {
    return res
      .status(400)
      .json({ Error: "Please provide a valid numerical earning" });
  }

  //   Trade Side Validation
  if (req.body.tradeSide) {
    if (req.body.tradeSide !== "Buy" && req.body.tradeSide !== "Sell")
      return res
        .status(400)
        .json({ Error: "Please provide a valid trade side" });
  }

  // Market Segment Validation:
  if (req.body.marketSegment) {
    if (
      req.body.marketSegment !== "Stock" &&
      req.body.marketSegment !== "Futures" &&
      req.body.marketSegment !== "Options" &&
      req.body.marketSegment !== "CFD" &&
      req.body.marketSegment !== "Forex"
    )
      return res
        .status(400)
        .json({ Error: "Please provide a valid market segment" });
  }

  // Trade Type Validation
  if (req.body.tradeType) {
    if (
      req.body.tradeType !== "Intraday" &&
      req.body.tradeType !== "Swing" &&
      req.body.tradeType !== "Positional"
    )
      return res
        .status(400)
        .json({ Error: "Please provide a valid trade type" });
  }

  try {
    if (req.body.account) {
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
    }

    // Updating the trade:
    let trade;
    try {
      trade = await Trade.findById(req.params.id);
    } catch {
      return res.status(404).json({ Error: "Trade not found" });
    }

    if (!trade) return res.status(404).json({ Error: "Trade not found" });

    let updated = {};
    if (req.body.account) updated.account = req.body.account;
    if (req.body.symbol) updated.symbol = req.body.symbol;
    if (req.body.tradeType) updated.tradeType = req.body.tradeType;
    if (req.body.tradeSide) updated.tradeSide = req.body.tradeSide;
    if (req.body.marketSegment) updated.marketSegment = req.body.marketSegment;
    if (req.body.entryDate) updated.entryDate = req.body.entryDate;
    if (req.body.quantity) updated.quantity = Number(req.body.quantity);
    if (req.body.entryPrice) updated.entryPrice = Number(req.body.entryPrice);
    if (req.body.exitDate) updated.exitDate = req.body.exitDate;
    if (req.body.exitPrice) updated.exitPrice = Number(req.body.exitPrice);
    if (req.body.brokerage) updated.brokerage = Number(req.body.brokerage);
    if (req.body.earning) updated.earning = Number(req.body.earning);

    trade = await Trade.findByIdAndUpdate(req.params.id, updated);
    trade = await Trade.findById(req.params.id);

    return res.status(200).json(trade);
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
    return res.status(400).json({ Error: "Please provide a valid trade id" });

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

    // Deleting the trade:
    let trade;
    try {
      trade = await Trade.findById(req.params.id);
    } catch {
      return res.status(404).json({ Error: "Trade not found" });
    }

    if (!trade) return res.status(404).json({ Error: "Trade not found" });

    trade = await Trade.findByIdAndDelete(req.params.id);

    return res.status(200).json({ Success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

module.exports = router;
