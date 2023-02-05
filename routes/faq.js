const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchUser");
const User = require("../models/User");
const FAQ = require("../models/FAQ");

router.post("/add", fetchUser, async (req, res) => {
  const user = await User.findById(req.user.id).select("email");

  if (user.email !== process.env.ADMIN_EMAIL)
    return res.status(401).json({ Error: "Underprivileged User" });

  if (
    !req.body.question ||
    !req.body.answer ||
    !req.body.question > 0 ||
    !req.body.answer > 0
  )
    return res
      .status(406)
      .json({ Error: "Please provide a valid question and answer" });

  try {
    let question = await FAQ.findOne({ question: req.body.question });
    if (question)
      return res.status(409).json({ Error: "Question already exists" });

    question = await FAQ.create({
      question: req.body.question,
      answer: req.body.answer,
    });

    return res.status(200).json({ Success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.get("/get", fetchUser, async (req, res) => {
  try {
    const questions = await FAQ.find().select("-__v");
    return res.status(200).json(questions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.put("/update", fetchUser, async (req, res) => {
  const user = await User.findById(req.user.id).select("email");

  if (user.email !== process.env.ADMIN_EMAIL)
    return res.status(401).json({ Error: "Underprivileged User" });

  if (!req.body.questionId || (!req.body.answer && !req.body.question))
    return res.status(406).json({ Error: "Please provide a valid update" });

  try {
    let question;
    try {
      question = await FAQ.findById(req.body.questionId);
    } catch {
      return res.status(404).json({ Error: "Question not found" });
    }

    if (!question) return res.status(404).json({ Error: "Question not found" });

    let updated = {};
    if (req.body.question) updated.question = req.body.question;
    if (req.body.answer) updated.answer = req.body.answer;

    question = await FAQ.findByIdAndUpdate(req.body.questionId, updated);
    question = await FAQ.findById(req.body.questionId);

    return res.status(200).json(question);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.delete("/delete", fetchUser, async (req, res) => {
  const user = await User.findById(req.user.id).select("email");

  if (user.email !== process.env.ADMIN_EMAIL)
    return res.status(401).json({ Error: "Underprivileged User" });

  if (!req.body.questionId)
    return res
      .status(406)
      .json({ Error: "Please provide a valid question id" });

  try {
    let question;
    try {
      question = await FAQ.findById(req.body.questionId);
    } catch {
      return res.status(404).json({ Error: "Question not found" });
    }

    if (!question) return res.status(404).json({ Error: "Question not found" });

    question = await FAQ.findByIdAndDelete(req.body.questionId);

    return res.status(200).json({ Success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

module.exports = router;
