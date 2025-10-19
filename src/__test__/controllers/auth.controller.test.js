import request from "supertest";
import express from "express";
import { authCallback } from "../../controllers/auth.controller.js";
import { User } from "../../models/user.model.js";
import { jest } from "@jest/globals";

const app = express();
app.use(express.json());
app.post("/auth/callback", authCallback);

describe("Auth Controller", () => {
  it("should create a new user on auth callback", async () => {
    const userData = {
      id: "clerk123",
      firstName: "John",
      lastName: "Doe",
      imageUrl: "http://example.com/image.jpg",
    };

    const response = await request(app).post("/auth/callback").send(userData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const user = await User.findOne({ clerkId: "clerk123" });
    expect(user).toBeTruthy();
    expect(user.fullName).toBe("John Doe");
    expect(user.imageUrl).toBe(userData.imageUrl);
  });

  it("should not create duplicate user", async () => {
    await User.create({
      clerkId: "clerk456",
      fullName: "Jane Doe",
      imageUrl: "http://example.com/image2.jpg",
    });

    const userData = {
      id: "clerk456",
      firstName: "Jane",
      lastName: "Doe",
      imageUrl: "http://example.com/image2.jpg",
    };

    const response = await request(app).post("/auth/callback").send(userData);

    expect(response.status).toBe(200);

    const users = await User.find({ clerkId: "clerk456" });
    expect(users.length).toBe(1);
  });
});
