const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { connection } = require("./db");
const { userRouter } = require("./routes/user.route");
const { noteRouter } = require("./routes/note.route");
const { auth } = require("./midddlewere/auth.middlewere");

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use("/user", userRouter);
app.use("/notes", noteRouter);

app.get("/home", (req, res) => {
  res.send({ msg: "Welcome to Note Application" });
});

app.use(auth);
app.get("/dashboard", (req, res) => {
  res.send({ msg: "Welcome to Note Application" });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, async () => {
  try {
    await connection;
    console.log("DB Connected");
  } catch (error) {
    console.log("DB connection error:", error.message);
  }
  console.log(`Server started on port ${PORT}`);
});