const jwt = require("jsonwebtoken");
const User = require("../models/User");

const fetchUser = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res
      .status(401)
      .json({ Error: "Please authenticate using a valid token" });

  try {
    jwt.verify(token, process.env.JWT_SECRET, async (err, data) => {
      if (err) return res.status(403).json({ Error: "Please login again" });

      let user = await User.findById(data.user.id)
        .select("-__v")
        .select("-DateAdded");

      if (!user) return res.status(401).json({ Error: "User not found" });

      req.user = data.user;
      next();
    });
  } catch (err) {
    return res
      .status(401)
      .json({ Error: "Please authenticate using a valid token" });
  }
};

module.exports = fetchUser;
