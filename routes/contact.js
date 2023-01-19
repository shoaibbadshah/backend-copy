const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchUser");
const User = require("../models/User");
const Contact = require("../models/Contact");

router.post("/add", async (req, res) => {
  if (
    !req.body.name ||
    !req.body.email ||
    !req.body.message ||
    req.body.message?.length < 20
  )
    return res.status(406).json({
      Error:
        "Please provide a valid name, email, and a message longer than 20 characters",
    });

  try {
    const contact = await Contact.create({
      name: req.body.name,
      email: req.body.email,
      message: req.body.message,
    });

    return res.status(200).json({ Success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json("Internal Server Error");
  }
});

router.get("/get/:contactId", fetchUser, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user.email !== process.env.ADMIN_EMAIL)
    return res.status(401).json({ Error: "Underprivileged User" });

  if (!req.params.contactId)
    return res.status(406).json({ Error: "Please provide a valid contact id" });
  try {
    const contact = await Contact.findById(req.params.contactId).select("-__v");

    if (!contact) return res.status(404).json({ Error: "Contact not found" });
    return res.status(200).json(contact);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.get("/getall", fetchUser, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user.email !== process.env.ADMIN_EMAIL)
    return res.status(401).json({ Error: "Underprivileged User" });

  try {
    const contacts = await Contact.find().select("-__v");
    return res.status(200).json(contacts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.delete("/delete", fetchUser, async (req, res) => {
  const user = await User.findById(req.user.id).select("email");

  if (user.email !== process.env.ADMIN_EMAIL)
    return res.status(401).json({ Error: "Underprivileged User" });

  if (!req.body.contactId)
    return res.status(406).json({ Error: "Please provide a valid contact id" });

  try {
    let contact;
    try {
      contact = await Contact.findById(req.body.contactId);
    } catch {
      return res.status(404).json({ Error: "Contact not found" });
    }

    if (!contact) return res.status(404).json({ Error: "Contact not found" });

    contact = await Contact.findByIdAndDelete(req.body.contactId);

    return res.status(200).json({ Success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json("Internal Server Error");
  }
});

module.exports = router;
