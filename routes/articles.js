const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchUser");
const User = require("../models/User");
const multer = require("multer");
const uniqid = require("uniqid");
const fs = require("fs");
const Article = require("../models/Article");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `BlogImages/`);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + uniqid() + ".jpg";
    cb(null, uniqueSuffix);
  },
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid mimetype"), false);
  }
};
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
  },
  fileFilter: fileFilter,
});

router.post("/add", upload.single("thumbnail"), async (req, res) => {
  if (
    !req.body.title ||
    !req.body.description ||
    !req.body.title?.length > 10 ||
    !req.body.description?.length > 20
  )
    return res.status(406).json({
      Error:
        "Please provide a valid title longer than 10 characters, and a description longer than 20 characters",
    });

  try {
    const image = req.file.filename;

    let videoURL = "";
    let videoID = "";
    if (req.body.video) videoURL = req.body.video;

    if (videoURL.startsWith("https://youtube.com/"))
      videoID = videoURL.split("?v=")[1];
    else if (videoURL.startsWith("https://youtu.be/"))
      videoID = videoURL.split("be/")[1];
    else
      return res
        .status(406)
        .json({ Error: "Please provide a valid YouTube video URL" });

    videoURL = `https://www.youtube.com/embed/${videoID}`;

    const article = await Article.create({
      title: req.body.title,
      description: req.body.description,
      video: videoURL,
      image,
    });

    return res.status(200).json({ Success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.get("/get/:articleId", fetchUser, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user.email !== process.env.ADMIN_EMAIL)
    return res.status(401).json({ Error: "Underprivileged User" });

  if (!req.params.articleId)
    return res.status(406).json({ Error: "Please provide a valid article id" });
  try {
    const article = await Article.findById(req.params.articleId).select("-__v");

    if (!article) return res.status(404).json({ Error: "Article not found" });
    return res.status(200).json(article);
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
    const articles = await Article.find().select("-__v");
    return res.status(200).json(articles);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.put(
  "/updatethumbnail",
  fetchUser,
  upload.single("thumbnail"),
  async (req, res) => {
    const user = await User.findById(req.user.id).select("email");

    if (user.email !== process.env.ADMIN_EMAIL)
      return res.status(401).json({ Error: "Underprivileged User" });

    if (!req.body.articleId)
      return res.status(406).json({
        Error: "Please provide a valid article id",
      });

    try {
      let article;
      try {
        article = await Article.findById(req.body.articleId);
      } catch {
        return res.status(404).json({ Error: "Article not found" });
      }

      if (!article) return res.status(404).json({ Error: "Article not found" });

      const updated = {
        image: req.file.filename,
      };

      fs.unlinkSync(`BlogImages/${article.image}`);

      article = await Article.findByIdAndUpdate(
        req.body.articleId,
        { $set: updated },
        { new: false }
      );
      article = await Article.findById(article.id);

      return res.status(200).json(article);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ Error: "Internal Server Error" });
    }
  }
);

router.put("/update", fetchUser, async (req, res) => {
  const user = await User.findById(req.user.id).select("email");

  if (user.email !== process.env.ADMIN_EMAIL)
    return res.status(401).json({ Error: "Underprivileged User" });

  if (
    !req.body.articleId ||
    (!req.body.title && !req.body.description && !req.body.video)
  )
    return res.status(406).json({
      Error:
        "Please provide a valid article id, title and/or description and/or video url",
    });

  try {
    let article;
    try {
      article = await Article.findById(req.body.articleId);
    } catch {
      return res.status(404).json({ Error: "Article not found" });
    }

    if (!article) return res.status(404).json({ Error: "Article not found" });

    let updated = {};

    if (req.body.title) updated.title = req.body.title;
    if (req.body.description) updated.description = req.body.description;
    if (req.body.video) updated.video = req.body.video;

    article = await Article.findByIdAndUpdate(
      req.body.articleId,
      { $set: updated },
      { new: false }
    );
    article = await Article.findById(article.id);

    return res.status(200).json(article);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

router.delete("/delete", fetchUser, async (req, res) => {
  const user = await User.findById(req.user.id).select("email");

  if (user.email !== process.env.ADMIN_EMAIL)
    return res.status(401).json({ Error: "Underprivileged User" });

  if (!req.body.articleId)
    return res.status(406).json({ Error: "Please provide a valid article id" });

  try {
    let article;
    try {
      article = await Article.findById(req.body.articleId);
    } catch {
      return res.status(404).json({ Error: "Article not found" });
    }

    if (!article) return res.status(404).json({ Error: "Article not found" });

    fs.unlinkSync(`BlogImages/${article.image}`);

    article = await Article.findByIdAndDelete(req.body.articleId);

    return res.status(200).json({ Success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: "Internal Server Error" });
  }
});

module.exports = router;
