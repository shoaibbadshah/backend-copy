require("dotenv").config();
const express = require("express");
const connectToMongo = require("./db");
const bodyParser = require("body-parser");
const cors = require("cors");

connectToMongo();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.get("/", (req, res) => {
  return res.status(200).send("Welcome to the API of journalmytrade.com");
});

let options = {
  dotfiles: "ignore",
  etag: true,
  extensions: ["htm", "html"],
  index: false,
  maxAge: "7d",
  redirect: false,
  setHeaders: (res, path, stat) => {
    res.set("x-timestamp", Date.now());
  },
};

app.use(bodyParser.json());
app.use(express.static("profiles", options));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/faq", require("./routes/faq"));
app.use("/api/pricing", require("./routes/pricing"));
app.use("/api/razorpay", require("./routes/razorpay"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/articles", require("./routes/articles"));

app.get("/articleimage/:imageId", async (req, res) => {
  try {
    let imageId = req.params.imageId;

    res.status(200).sendFile(__dirname + `/BlogImages/${imageId}`);
  } catch (err) {
    res.status(500).json({ Error: "Internal Server Error" });
  }
});

app.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));
