const User = require("../models/user");
const Blog = require("../models/blog");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const usersInDb = async () => {
  const users = await User.find({});
  return users.map((u) => u.toJSON());
};

const dummy = (blogs) => {
  return 1;
};

const totalLikes = (blogs) => {
  const reducer = (sum, item) => {
    return sum + item;
  };

  const blogsLikes = blogs.map((blogs) => blogs.likes);

  return blogsLikes.reduce(reducer, 0);
};

const favoriteBlog = (blogs) => {
  const blogsLikes = blogs.map((blogs) => blogs.likes);
  const largestIndex = blogsLikes.indexOf(Math.max(...blogsLikes));
  const largestinfo = blogs[largestIndex];

  return {
    title: largestinfo.title,
    author: largestinfo.author,
    likes: largestinfo.likes,
  };
};

const blogsInDb = async () => {
  const blogs = await Blog.find({});
  return blogs.map((b) => b.toJSON());
};

const getAnotherUserToken = async () => {
  const passwordHash = await bcrypt.hash("sekret", 10);
  const anotherUser = new User({ username: "anotherUser", passwordHash });
  await anotherUser.save();

  const userForToken = {
    username: anotherUser.username,
    id: anotherUser._id,
  };

  const token = jwt.sign(userForToken, process.env.SECRET);

  return token;
};

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  usersInDb,
  blogsInDb,
  getAnotherUserToken,
};
