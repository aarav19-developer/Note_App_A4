const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { userModel } = require("../model/user.model");
const userRouter = express.Router();

userRouter.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    bcrypt.hash(password, 5, async (err, hash) => {
      if (hash) {
        const user = new userModel({ name, email, password: hash });
        await user.save();
        res.send({ msg: "User registered successfully" });
      } else {
        res.send({ msg: "Something went wrong" });
      }
    });
  } catch (error) {
    res.send({ msg: "Something went wrong" });
  }
});

userRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.find({ email });
    if (user.length > 0) {
      bcrypt.compare(password, user[0].password, async (err, result) => {
        if (result) {
          const token = jwt.sign({ userId: user[0]._id, foo: "bar" }, "coding");
          res.send({ msg: "User login successfully", token, name: user[0].name, userId: user[0]._id });
        } else {
          res.send({ msg: "wrong credientials" });
        }
      });
    } else {
      res.send({ msg: "Signup first" });
    }
  } catch (error) {
    res.send({ msg: "Something went wrong" });
  }
});

module.exports = { userRouter };