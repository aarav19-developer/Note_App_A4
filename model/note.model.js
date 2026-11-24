const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, default: "" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  color: { type: String, default: "#ffffff" },
}, { timestamps: true });

const noteModel = mongoose.model("note", noteSchema);
module.exports = { noteModel };