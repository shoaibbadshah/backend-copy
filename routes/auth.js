const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const jwtdecode = require("jwt-decode");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const fetchUser = require("../middleware/fetchUser");
const User = require("../models/User");

const serverLoc = "http://localhost:5000";
const verificationRedirectURL = "https://google.com";
const resetPasswordURL = "https://google.com";

require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: "formal.googl@gmail.com", pass: "nkgwszqhzpzugcdb" },
});

const verifyEmail = (user) => {
  const verificationData = {
    user: user.id,
    email: user.email,
  };

  const verificationToken = jwt.sign(
    verificationData,
    process.env.EMAIL_VERIFICATION_TOKEN_SECRET
  );

  const mailOptions = {
    from: "formal.googl@gmail.com",
    to: user.email,
    subject: "Journalmytrade - Email Verification",
    html: `
    <div style="width:100%; padding:3%; color:black; background:#e3e3e3; box-sizing: border-box;">
      <div style="width:100%; text-align:center;">
        <h1>Journalmytrade Email Verification</h1>
      </div>

      <p style="font-size:medium;color:black;">Hi ${user.username},<br/><br/>We're happy you signed up for Journalmytrade. To start using the app, please confirm your email address.</p>
      <br/>
      <div>
        <a href="${verificationRedirectURL}/${verificationToken}" style="text-decoration:none; background:#007be8; color:white; cursor:pointer; font-weight:bold; font-size:medium; padding: 1rem 2rem; border:none; outline:none; border-radius:0.5rem; text-align:center;">
          Verify Now
        </a>
      </div>
      <br/>
      <p style="font-size:medium;">Welcome to Journalmytrade!<br/>The Journalmytrade Team</p>
    </div>`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.log(err);
    else console.log(info);
  });
};

const forgotPassword = (user) => {
  const verificationData = {
    user: user.id,
    email: user.email,
  };

  const resetPassToken = jwt.sign(
    verificationData,
    process.env.RESET_PASSWORD_SECRET,
    {
      expiresIn: "2h",
    }
  );

  const mailOptions = {
    from: "formal.googl@gmail.com",
    to: user.email,
    subject: "Journalmytrade - Reset Password",
    html: `
    <div style="width:100%; padding:3%; color:black; background:#e3e3e3; box-sizing: border-box;">
      <div style="width:100%; text-align:center;">
        <h1>Journalmytrade Reset Password</h1>
      </div>

      <p style="font-size:medium;">Seems like you forgot your password for Journalmytrade. If this is true, click below to reset your password.</p>
      <br/>
      <div>
        <a href="${resetPasswordURL}/${resetPassToken}" style="text-decoration:none; background:#007be8; color:white; cursor:pointer; font-weight:bold; font-size:medium; padding: 1rem 2rem; border:none; outline:none; border-radius:0.5rem; text-align:center;">
          Reset Password
        </a>
      </div>
      <br/>
      <p style="font-size:medium;">If you did not request a password reset, you can safely ignore this email.</p>
      <p style="font-size:medium;">The Journalmytrade Team</p>
    </div>`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.log(err);
    else console.log(info);
  });
};

const generateAuthToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "5d" });
};

router.post("/verify/:token", async (req, res) => {
  let { token } = req.params;
  if (!token)
    return res.status(406).json({ Error: "Invalid information provided" });

  try {
    let userDetails = jwtdecode(token);
    let user = await User.findById(userDetails.user);

    if (user) {
      if (user.email === userDetails.email) {
        if (user.emailVerified === true) {
          return res.status(409).json({ Error: "Email already verified" });
        }
        user = await User.findByIdAndUpdate(userDetails.user, {
          $set: { emailVerified: true },
          new: false,
        });
        return res.status(200).json({ Success: "Email verified successfully" });
      }
      return res.status(406).json({ Error: "Link not valid for user" });
    }
    return res.status(404).json({ Error: "User not found" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.post("/reverify", fetchUser, async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select(
      "-DateAdded -__v -password"
    );

    if (user) {
      if (user.emailVerified === true) {
        return res.status(406).json({ Error: "Email already verified" });
      }
      verifyEmail(user);
      return res.status(200).json({ Success: "Email sent successfully" });
    }
    return res.status(404).json({ Error: "User not found" });
  } catch (error) {
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.post("/forgotpassword", async (req, res) => {
  if (!req.body.email) {
    return res.status(406).json({ Error: "Please provide a valid email" });
  }
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      forgotPassword(user);
      return res.status(200).json({ Success: "Email sent successfully" });
    }
    return res.status(404).json({ Error: "User not found" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.post("/resetpassword", async (req, res) => {
  if (!req.body.password || !req.body.resetToken) {
    return res
      .status(406)
      .json({ Error: "Please provide all the required details" });
  }
  try {
    const userId = await jwtdecode(req.body.resetToken).user;
    if (!userId) {
      return res.status(404).json({ Error: "User not found" });
    }

    let user = await User.findById(userId);
    if (user) {
      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);

      jwt.verify(
        req.body.resetToken,
        process.env.RESET_PASSWORD_SECRET,
        (err, data) => {
          if (err) return res.status(401).json({ Error: "Please login again" });
        }
      );

      if (res.headersSent === false) {
        user = await User.findByIdAndUpdate(user.id, {
          $set: { password: secPass },
          new: false,
        });
        return res.status(200).json({ Success: "Password reset successfully" });
      }
    }
    if (res.headersSent === false) {
      return res.status(404).json({ Error: "User not found" });
    }
  } catch (error) {
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.post("/generatenewtoken", (req, res) => {
  try {
    const refreshToken = req.body.token;
    if (!refreshToken || refreshToken === null)
      return res
        .status(200)
        .json({ Error: "Please provide a valid refresh token" });

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, data) => {
      if (err) return res.status(200).json({ Error: "Please login again" });
      data = { user: { id: data.user.id } };
      const authToken = generateAuthToken(data);

      return res.status(200).json({ authToken });
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.get("/getuser", fetchUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -__v -DateAdded"
    );
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.post("/createaccount", async (req, res) => {
  if (!req.body.username || !req.body.email || !req.body.password) {
    return res
      .status(406)
      .json({ Error: "Please fill out all the required fields" });
  }

  try {
    let user = await User.findOne({ email: req.body.email });

    if (user) return res.status(409).json({ Error: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(req.body.password, salt);

    user = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: secPass,
    });

    const data = {
      user: {
        id: user.id,
      },
    };

    const authToken = generateAuthToken(data);
    const refreshToken = jwt.sign(data, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "30d",
    });

    verifyEmail(user);

    return res.json({ authToken, refreshToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    let user = await User.findOne({ email: req.body.email });

    if (user) {
      bcrypt.compare(req.body.password, user.password, (err, result) => {
        if (!result)
          return res.status(401).json({ Error: "Incorrect Email or Password" });

        const data = {
          user: {
            id: user.id,
          },
        };

        const authToken = generateAuthToken(data);
        const refreshToken = jwt.sign(data, process.env.REFRESH_TOKEN_SECRET, {
          expiresIn: "30d",
        });

        return res.status(200).json({ authToken, refreshToken });
      });
    } else {
      return res.status(404).json({ Error: "Incorrect email or password" });
    }
  } catch (err) {
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.put("/updateuser", fetchUser, async (req, res) => {
  if (!req.body.password || !req.body.newPassword) {
    return res
      .status(400)
      .json({ Error: "Please provide all the required fields" });
  }
  try {
    let user = await User.findById(req.user.id)
      .select("-__v")
      .select("-_id")
      .select("-DateAdded");

    if (user) {
      const passwordCompare = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (passwordCompare === true) {
        let updated = {};

        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(req.body.newPassword, salt);
        updated.password = secPass;

        user = await User.findByIdAndUpdate(
          req.user.id,
          { $set: updated },
          { new: false }
        ).select("-password");

        return res.status(200).json({ Success: true });
      }
      return res.status(401).json({ Error: "Wrong password" });
    }

    return res.status(404).json({ Error: "User not found" });
  } catch (err) {
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.delete("/deleteuser", fetchUser, async (req, res) => {
  if (!req.body.password) {
    return res.status(400).json({ Error: "Please provide a valid password" });
  }
  try {
    let user = await User.findById(req.user.id)
      .select("-__v")
      .select("-DateAdded");

    if (user === null) {
      return res.status(404).json({ Error: "User not found" });
    }

    const passCompare = await bcrypt.compare(req.body.password, user.password);

    if (passCompare === false) {
      return res.status(401).json({ Error: "Incorrect Password" });
    }

    user = await User.findByIdAndDelete(user.id);
    return res.status(200).json({ Success: true });
  } catch (err) {
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

module.exports = router;
