const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { noteModel } = require("../model/note.model");
const noteRouter = express.Router();

const SECRET_KEY = "shouthub_notes_key_2024";
const ALGO = "aes-256-cbc";
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.scryptSync(SECRET_KEY, "salt", 32);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text) {
  if (!text || !text.includes(":")) return text;
  try {
    const [ivHex, encrypted] = text.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const key = crypto.scryptSync(SECRET_KEY, "salt", 32);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return text;
  }
}

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).send({ msg: "No token" });
  try {
    const decoded = jwt.verify(token, "coding");
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).send({ msg: "Invalid token" });
  }
};

// GET all notes
noteRouter.get("/", verifyToken, async (req, res) => {
  try {
    const notes = await noteModel.find({ userId: req.userId }).sort({ updatedAt: -1 });
    const decrypted = notes.map(n => ({
      ...n.toObject(),
      content: decrypt(n.content),
    }));
    res.send({ notes: decrypted });
  } catch {
    res.status(500).send({ msg: "Error fetching notes" });
  }
});

// POST create note
noteRouter.post("/", verifyToken, async (req, res) => {
  const { title, content, color } = req.body;
  try {
    const note = new noteModel({
      title,
      content: encrypt(content),
      color,
      userId: req.userId,
    });
    await note.save();
    res.send({ msg: "Note created", note: { ...note.toObject(), content } });
  } catch {
    res.status(500).send({ msg: "Error creating note" });
  }
});

// PUT update note
noteRouter.put("/:id", verifyToken, async (req, res) => {
  const { title, content, color } = req.body;
  try {
    const note = await noteModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { title, content: encrypt(content), color },
      { new: true }
    );
    if (!note) return res.status(404).send({ msg: "Note not found" });
    res.send({ msg: "Note updated", note: { ...note.toObject(), content } });
  } catch {
    res.status(500).send({ msg: "Error updating note" });
  }
});

// DELETE note
noteRouter.delete("/:id", verifyToken, async (req, res) => {
  try {
    await noteModel.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.send({ msg: "Note deleted" });
  } catch {
    res.status(500).send({ msg: "Error deleting note" });
  }
});

module.exports = { noteRouter };