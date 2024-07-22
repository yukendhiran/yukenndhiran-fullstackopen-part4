const blogsRouter = require("express").Router();
const Blog = require("../models/blog.js");

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
    const { title, url } = request.body;

    if (!title || !url) {
      return response.status(400).json({ error: "title or url missing" });
    }
    const blog = new Blog(request.body);
    const result = await blog.save();
    response.status(201).json(result);
  } catch (error) {
    console.error(error);
    response.status(500).send("Internal Server Error");
  }
});

blogsRouter.delete("/:id", async (request, response) => {
  try {
    const result = await Blog.findByIdAndRemove(request.params.id);
    if (result) {
      response.status(204).end();
    } else {
      response.status(404).end();
    }
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
  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
    new: true,
  });
  response.json(updatedBlog);
});

module.exports = blogsRouter;
