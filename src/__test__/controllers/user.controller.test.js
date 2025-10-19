import request from "supertest";
import express from "express";
import { getAllUsers, getMessages } from "../../controllers/user.controller.js";
import { User } from "../../models/user.model.js";
import { Message } from "../../models/message.model.js";
import { jest } from "@jest/globals";

const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req, res, next) => {
  req.auth = { userId: "currentUserId" };
  next();
});

app.get("/users", getAllUsers);
app.get("/messages/:userId", getMessages);

describe("User Controller", () => {
  beforeEach(async () => {
    await User.create([
      {
        clerkId: "currentUserId",
        fullName: "Current User",
        imageUrl: "http://example.com/current.jpg",
      },
      {
        clerkId: "user1",
        fullName: "User One",
        imageUrl: "http://example.com/user1.jpg",
      },
      {
        clerkId: "user2",
        fullName: "User Two",
        imageUrl: "http://example.com/user2.jpg",
      },
    ]);

    await Message.create([
      {
        senderId: "user1",
        receiverId: "currentUserId",
        content: "Hello from user1",
      },
      { senderId: "currentUserId", receiverId: "user1", content: "Hello back" },
      { senderId: "user2", receiverId: "currentUserId", content: "Hi there" },
    ]);
  });

  it("should get all users except current user", async () => {
    const response = await request(app).get("/users");

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    expect(response.body.some((user) => user.clerkId === "currentUserId")).toBe(
      false
    );
  });

  it("should get messages between current user and specified user", async () => {
    const response = await request(app).get("/messages/user1");

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    // Messages are sorted by createdAt, so we check both possible orders
    const contents = response.body.map((msg) => msg.content);
    expect(contents).toContain("Hello from user1");
    expect(contents).toContain("Hello back");
  });

  it("should return empty array if no messages", async () => {
    const response = await request(app).get("/messages/user3");

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(0);
  });
});
