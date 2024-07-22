const { test, after, beforeEach, describe } = require("node:test");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const assert = require("node:assert");
const api = supertest(app);

const Blog = require("../models/blog");

const initialBlogs = [
  {
    id: "5a422a851b54a676234d17f7",
    title: "React patterns",
    author: "Michael Chan",
    url: "https://reactpatterns.com/",
    likes: 7,
    __v: 0,
  },
  {
    id: "5a422aa71b54a676234d17f8",
    title: "Go To Statement Considered Harmful",
    author: "Edsger W. Dijkstra",
    url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
    likes: 5,
    __v: 0,
  },
  {
    id: "5a422b3a1b54a676234d17f9",
    title: "Canonical string reduction",
    author: "Edsger W. Dijkstra",
    url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
    likes: 12,
    __v: 0,
  },
  {
    id: "5a422b891b54a676234d17fa",
    title: "First class tests",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll",
    likes: 10,
    __v: 0,
  },
  {
    id: "5a422ba71b54a676234d17fb",
    title: "TDD harms architecture",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html",
    likes: 0,
    __v: 0,
  },
  {
    id: "5a422bc61b54a676234d17fc",
    title: "Type wars",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
    likes: 2,
    __v: 0,
  },
];
describe("related to get", () => {
  beforeEach(async () => {
    await Blog.deleteMany({});
    const blogObjects = initialBlogs.map((blog) => new Blog(blog));
    const promiseArray = blogObjects.map((blog) => blog.save());
    await Promise.all(promiseArray);
  });

  test("blogs are returned as json", async () => {
    await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("there are 6 blogs", async () => {
    const response = await api.get("/api/blogs");

    assert.strictEqual(response.body.length, initialBlogs.length);
  });

  test("unique identifier property of the blog posts is named id", async () => {
    const response = await api.get("/api/blogs");

    response.body.forEach((blog) => {
      const initialBlog = initialBlogs.find((b) => b.id.toString() === blog.id);

      assert.strictEqual(blog.id, initialBlog.id.toString());
    });
  });
});

describe("related to post", () => {
  test("a valid blog can be added ", async () => {
    const newBlog = {
      id: "5a422bc61b54a676234d12ac",
      title: "Type wars",
      author: "Robert C. Martin",
      url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
      likes: 2,
      __v: 0,
    };

    await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const response = await api.get("/api/blogs");

    assert.strictEqual(response.body.length, initialBlogs.length + 1);
  });

  test("if likes property is missing, it defaults to 0", async () => {
    const newBlog = {
      title: "Test Blog",
      author: "Test Author",
      url: "http://testurl.com",
    };

    const response = await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const createdBlog = response.body;
    assert.strictEqual(createdBlog.likes, 0);
  });

  test("expect 400 , if title is missing", async () => {
    const newBlog = {
      author: "Test Author",
      url: "http://testurl.com",
    };

    await api.post("/api/blogs").send(newBlog).expect(400);
  });

  test("expect 400 , if url is missing", async () => {
    const newBlog = {
      title: "Test Blog",
      author: "Test Author",
    };

    await api.post("/api/blogs").send(newBlog).expect(400);
  });
});

describe("related to delete", () => {
  test("expect 204, if id is valid", async () => {
    const validId = "5a422ba71b54a676234d17fb";

    await api.delete(`/api/blogs/${validId}`).expect(204);

    const blogsAtEnd = await Blog.find({});
    const ids = blogsAtEnd.map((blog) => blog.id.toString());

    assert.strictEqual(ids.includes(validId), false);
  });
});

describe("related to update", () => {
  test("updates the likes of a blog post", async () => {
    const validId = "5a422aa71b54a676234d17f8";
    const newLikes = { likes: 10 };

    const response = await api
      .put(`/api/blogs/${validId}`)
      .send(newLikes)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const updatedBlog = await Blog.findById(validId);
    assert.strictEqual(updatedBlog.likes, newLikes.likes);
  });
});

after(async () => {
  await mongoose.connection.close();
});
