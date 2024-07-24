const bcrypt = require("bcrypt");
const usersRouter = require("express").Router();
const User = require("../models/user");

usersRouter.get("/", async (request, response) => {
  const users = await User.find({}).populate("blogs");
  response.json(users);
});

usersRouter.post("/", async (request, response) => {
  const { username, name, password } = request.body;

  if (password.length < 3) {
    return response
      .status(400)
      .json({ error: "Password must be at least 3 characters long" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = new User({
    username,
    name,
    passwordHash,
  });

  try {
    const savedUser = await user.save();
    response.status(201).json(savedUser);
  } catch (error) {
    if (error.name === "MongoServerError" && error.code === 11000) {
      return response
        .status(400)
        .json({ error: "expected `username` to be unique" });
    }
    response.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = usersRouter;
