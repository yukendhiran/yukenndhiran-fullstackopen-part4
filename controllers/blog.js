const blogsRouter = require("express").Router();
const Blog = require("../models/blog.js");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

blogsRouter.get("/", async (request, response) => {
  try {
    const blogs = await Blog.find({});
    response.json(blogs);
  } catch (error) {
    console.error(error);
    response.status(500).send("Internal Server Error");
  }
});

blogsRouter.post("/", async (request, response) => {
  try {
    const { title, url, author, likes } = request.body;
    const user = request.user;
    if (!title || !url) {
      return response.status(400).json({ error: "title or url missing" });
    }

    const decodedToken = jwt.verify(request.token, process.env.SECRET);

    if (!decodedToken.id) {
      return response.status(401).json({ error: "token invalid" });
    }
    const userDb = await User.findById(decodedToken.id);

    console.log(userDb);
    if (!userDb) {
      return response.status(400).json({ error: "invalid user ID" });
    }

    const blog = new Blog({
      title,
      url,
      likes: likes || 0,
      author,
      user: userDb.id,
    });

    const result = await blog.save();

    userDb.blogs = userDb.blogs.concat(result.id);
    await userDb.save();

    response.status(201).json(result);
  } catch (error) {
    console.error(error);
    response.status(500).send("Internal Server Error");
  }
});

blogsRouter.delete("/:id", async (request, response) => {
  try {
    const { token, user } = request;
    if (!token) {
      return response.status(401).json({ error: "token missing or invalid" });
    }

    const decodedToken = jwt.verify(token, process.env.SECRET); // Use your secret key
    if (!decodedToken.id) {
      return response.status(401).json({ error: "token invalid" });
    }

    const blog = await Blog.findById(request.params.id);
    if (!blog) {
      return response.status(404).json({ error: "blog not found" });
    }

    const userDb = await User.findById(decodedToken.id);
    if (!user) {
      return response.status(401).json({ error: "user not found" });
    }

    if (blog.user.toString() !== userDb.id.toString()) {
      return response
        .status(403)
        .json({ error: "not authorized to delete this blog" });
    }

    await Blog.findByIdAndRemove(request.params.id);
    response.status(204).end();
  } catch (error) {
    console.error(error);
    response.status(500).send("Internal Server Error");
  }
});

blogsRouter.put("/:id", async (request, response) => {
  const { likes } = request.body;
  const blog = {
    likes,
  };
  try {
    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
      new: true,
    });
    response.json(updatedBlog);
  } catch (error) {
    console.error(error);
    response.status(500).send("Internal Server Error");
  }
});

module.exports = blogsRouter;
