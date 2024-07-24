const { test, after, beforeEach, describe } = require("node:test");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const assert = require("node:assert");
const api = supertest(app);
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Blog = require("../models/blog");

const helper = require("../utils/list_helper");

const initialBlogs = [
  {
    title: "React patterns",
    author: "Michael Chan",
    url: "https://reactpatterns.com/",
    likes: 7,
  },
  {
    title: "Go To Statement Considered Harmful",
    author: "Edsger W. Dijkstra",
    url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
    likes: 5,
  },
  {
    title: "Canonical string reduction",
    author: "Edsger W. Dijkstra",
    url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
    likes: 12,
  },
  {
    title: "First class tests",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll",
    likes: 10,
  },
  {
    title: "TDD harms architecture",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html",
    likes: 0,
  },
  {
    title: "Type wars",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
    likes: 2,
  },
];

let token = "";

beforeEach(async () => {
  await User.deleteMany({});
  await Blog.deleteMany({});

  const passwordHash = await bcrypt.hash("sekret", 10);
  const user = new User({ username: "root", passwordHash });
  await user.save();

  const loginResponse = await api
    .post("/api/login")
    .send({ username: "root", password: "sekret" })
    .expect(200)
    .expect("Content-Type", /application\/json/);

  token = loginResponse.body.token;

  const blogObjects = initialBlogs.map(
    (blog) => new Blog({ ...blog, user: user.id }),
  );
  const promiseArray = blogObjects.map((blog) => blog.save());
  await Promise.all(promiseArray);
});

describe("related to get", () => {
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
      assert.ok(blog.id);
    });
  });
});

describe("related to post", () => {
  test("a valid blog can be added", async () => {
    const newBlog = {
      title: "Test Blog",
      author: "Test Author",
      url: "http://testurl.com",
      likes: 2,
    };

    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
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
      .set("Authorization", `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const createdBlog = response.body;
    assert.strictEqual(createdBlog.likes, 0);
  });

  test("expect 400 if title is missing", async () => {
    const newBlog = {
      author: "Test Author",
      url: "http://testurl.com",
    };

    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(newBlog)
      .expect(400);
  });

  test("expect 400 if url is missing", async () => {
    const newBlog = {
      title: "Test Blog",
      author: "Test Author",
    };

    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(newBlog)
      .expect(400);
  });
});

describe("related to delete", () => {
  test("expect 204 if id is valid", async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    const blogsAtEnd = await helper.blogsInDb();
    assert.strictEqual(blogsAtEnd.length, blogsAtStart.length - 1);
  });

  test("expect 401 if token is missing", async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];

    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(401);
  });

  test("expect 403 if token is invalid", async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];

    const anotherUserToken = await helper.getAnotherUserToken();

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set("Authorization", `Bearer ${anotherUserToken}`)
      .expect(403);
  });
});

describe("related to update", () => {
  test("updates the likes of a blog post", async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToUpdate = blogsAtStart[0];
    const newLikes = { likes: 10 };

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(newLikes)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const updatedBlog = await Blog.findById(blogToUpdate.id);
    assert.strictEqual(updatedBlog.likes, newLikes.likes);
  });
});

after(async () => {
  await mongoose.connection.close();
});
